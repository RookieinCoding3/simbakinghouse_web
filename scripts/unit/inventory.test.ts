import { parseRMToSen, rmFloatToSen, senToRMString, formatSen } from '../../lib/money'
import { parseQtyToMilli, milliToString, MILLI } from '../../lib/inventory/units'
import {
  readPublicSellUnits, readAllSellUnits, readStockConfig, deriveStockStatus, customerAvailability, normalizeSellUnit,
} from '../../lib/inventory/catalog'
import {
  reserve, release, deduct, add, count, allocateFefo, checkInvariants, availableMilli, batchSum,
  type ItemState, type Movement,
} from '../../lib/inventory/engine'
import { test, eq, ok, done } from './harness'

console.log('--- Money (integer sen) and quantities (integer milli-units) ---')

test('0.1 kg + 0.2 kg is exactly 0.3 kg (no float error)', () => {
  const a = parseQtyToMilli('0.1')!, b = parseQtyToMilli('0.2')!
  eq(a + b, 300)
  eq(milliToString(a + b), '0.3')
  ok(0.1 + 0.2 !== 0.3, 'sanity: floats really are wrong here')
})
test('RM 0.10 + RM 0.20 is exactly RM 0.30', () => {
  eq(parseRMToSen('0.10')! + parseRMToSen('0.20')!, 30)
  eq(formatSen(parseRMToSen('0.1')! + parseRMToSen('0.2')!), 'RM 0.30')
})
test('summing 1,000 x RM 0.01 gives exactly RM 10.00', () => {
  let total = 0
  for (let i = 0; i < 1000; i++) total += parseRMToSen('0.01')!
  eq(senToRMString(total), '10.00')
})
test('price parsing: accepts 12 / 12.5 / 12.50 / RM 1,200.50; rejects 3 decimals, negatives, text', () => {
  eq([parseRMToSen('12'), parseRMToSen('12.5'), parseRMToSen('12.50'), parseRMToSen('RM 1,200.50')], [1200, 1250, 1250, 120050])
  eq([parseRMToSen('1.234'), parseRMToSen('-1'), parseRMToSen('abc'), parseRMToSen('')], [null, null, null, null])
})
test('quantity parsing: 2 / 2.5 / 0.125; rejects 4 decimals and negatives unless allowed', () => {
  eq([parseQtyToMilli('2'), parseQtyToMilli('2.5'), parseQtyToMilli('0.125')], [2000, 2500, 125])
  eq([parseQtyToMilli('0.0001'), parseQtyToMilli('-2')], [null, null])
  eq(parseQtyToMilli('-2', { allowNegative: true }), -2000)
})
test('legacy RM floats convert to the nearest sen', () => {
  eq([rmFloatToSen(6.5), rmFloatToSen(19.99), rmFloatToSen(0.1 + 0.2)], [650, 1999, 30])
})

console.log('\n--- Old products read without migration ---')

test('an old product (price float, no stock fields) reads as one default unit, unmanaged', () => {
  const old = { name: 'Flour', price: 6.5, category: 'Flour', inStock: true }
  eq(readPublicSellUnits(old), [{ id: 'default', label: '1 pc', factorMilli: 1000, priceSen: 650, channel: 'both' }])
  eq(readStockConfig(old).managed, false)
  eq(customerAvailability(old), { sellable: true, status: null })
})
test('an old product with inStock false stays unsellable exactly as before, with no status', () => {
  eq(customerAvailability({ inStock: false }), { sellable: false, status: null })
})
test('an old product with no price reads as "Ask for price"', () => {
  eq(readPublicSellUnits({ name: 'Mystery' })[0].priceSen, null)
})
test('wholesale-only units come from the private doc and are marked wholesale', () => {
  const units = readAllSellUnits(
    { sellUnits: [{ id: 'kg', label: '1 kg', factorMilli: 1000, priceSen: 650, channel: 'both' }] },
    { wholesaleUnits: [{ id: 'bag', label: '25 kg bag', factorMilli: 25000, priceSen: 13000, channel: 'online' }] }
  )
  eq(units.map((u) => `${u.id}:${u.channel}`), ['kg:both', 'bag:wholesale'])
})
test('a wholesale-only product (empty public list) does NOT fall back to the legacy price', () => {
  eq(readPublicSellUnits({ price: 6.5, sellUnits: [] }), [])
})
test('invalid sell units are dropped (zero factor, negative price, no label)', () => {
  eq([normalizeSellUnit({ id: 'a', label: 'x', factorMilli: 0, priceSen: 1 }), normalizeSellUnit({ id: 'a', label: 'x', factorMilli: 1, priceSen: -1 }), normalizeSellUnit({ id: 'a', label: ' ', factorMilli: 1, priceSen: 1 })], [null, null, null])
})
test('status: out at <= 0 available, low at <= threshold, else in stock', () => {
  eq([deriveStockStatus(0, 5000), deriveStockStatus(-1, 5000), deriveStockStatus(5000, 5000), deriveStockStatus(5001, 5000)], ['out', 'out', 'low', 'in_stock'])
})
test('customer view of a managed product is a status only', () => {
  eq(customerAvailability({ managedStock: true, stockStatus: 'low', onHandMilli: 3 }), { sellable: true, status: 'low' })
  eq(customerAvailability({ managedStock: true, stockStatus: 'out' }), { sellable: false, status: 'out' })
})

console.log('\n--- Engine ---')

const fresh = (onHand: number, trackExpiry = false): ItemState => ({ onHandMilli: onHand, reservedMilli: 0, trackExpiry, batches: [] })

test('reserve then collect: reserved goes up, then onHand and reserved both go down', () => {
  const s = fresh(10 * MILLI)
  reserve(s, 3 * MILLI)
  eq([s.onHandMilli, s.reservedMilli, availableMilli(s)], [10000, 3000, 7000])
  deduct(s, 3 * MILLI, 'sale', 3 * MILLI)
  eq([s.onHandMilli, s.reservedMilli], [7000, 0])
})
test('release never takes reserved below zero', () => {
  const s = fresh(1000)
  reserve(s, 500)
  release(s, 900)
  eq(s.reservedMilli, 0)
})
test('FEFO: soonest expiry first, then no-expiry batches, oldest received first', () => {
  const batches = [
    { id: 'none', qtyMilli: 5000, expiryDate: null, receivedAt: 1 },
    { id: 'dec', qtyMilli: 2000, expiryDate: '2026-12-01', receivedAt: 3 },
    { id: 'nov-b', qtyMilli: 1000, expiryDate: '2026-11-01', receivedAt: 5 },
    { id: 'nov-a', qtyMilli: 1000, expiryDate: '2026-11-01', receivedAt: 2 },
  ]
  eq(allocateFefo(batches, 3500).allocations, [
    { batchId: 'nov-a', qtyMilli: 1000 }, { batchId: 'nov-b', qtyMilli: 1000 }, { batchId: 'dec', qtyMilli: 1500 },
  ])
  eq(allocateFefo(batches, 99000).shortMilli, 99000 - 9000)
})
test('restock with expiry creates a batch; a sale takes it FEFO; batches match onHand', () => {
  const s = fresh(0, true)
  add(s, 2000, 'restock', { batch: { id: 'b1', expiryDate: '2027-01-01', receivedAt: 1 } })
  add(s, 3000, 'restock', { batch: { id: 'b2', expiryDate: '2026-12-01', receivedAt: 2 } })
  const m = deduct(s, 3500, 'sale')
  eq(m.allocations, [{ batchId: 'b2', qtyMilli: 3000 }, { batchId: 'b1', qtyMilli: 500 }])
  eq([s.onHandMilli, batchSum(s)], [1500, 1500])
})
test('oversell takes onHand negative; batches stop at zero; a later restock first covers the deficit', () => {
  const s = fresh(0, true)
  add(s, 1000, 'restock', { batch: { id: 'b1', expiryDate: null, receivedAt: 1 } })
  deduct(s, 3000, 'oversold')
  eq([s.onHandMilli, batchSum(s)], [-2000, 0])
  add(s, 5000, 'restock', { batch: { id: 'b2', expiryDate: '2027-01-01', receivedAt: 2 } })
  eq([s.onHandMilli, batchSum(s)], [3000, 3000])
})
test('void puts stock back into the exact batches it came from', () => {
  const s = fresh(0, true)
  add(s, 2000, 'restock', { batch: { id: 'old', expiryDate: '2026-11-01', receivedAt: 1 } })
  add(s, 2000, 'restock', { batch: { id: 'new', expiryDate: '2027-11-01', receivedAt: 2 } })
  const sale = deduct(s, 3000, 'sale')
  add(s, 3000, 'void', { restore: sale.allocations })
  eq(s.batches.map((b) => b.qtyMilli), [2000, 2000])
})
test('count sets onHand to the counted value (up and down); unchanged count is a no-op', () => {
  const s = fresh(5000)
  eq(count(s, 7000)!.onHandDeltaMilli, 2000)
  eq(count(s, 1000)!.onHandDeltaMilli, -6000)
  eq(count(s, 1000), null)
})
test('rejects zero, negative and fractional milli-unit quantities', () => {
  for (const bad of [0, -1, 0.5]) {
    let threw = false
    try { reserve(fresh(1000), bad) } catch { threw = true }
    ok(threw, `accepted ${bad}`)
  }
})
test('property: 5,000 random operations keep every invariant', () => {
  let seed = 42
  const rnd = (n: number) => ((seed = (seed * 1103515245 + 12345) % 2147483648), seed % n)
  for (const trackExpiry of [false, true]) {
    const s = fresh(0, trackExpiry)
    const ledger: Movement[] = []
    for (let i = 0; i < 2500; i++) {
      const q = (rnd(50) + 1) * 100
      const op = rnd(6)
      if (op === 0) ledger.push(add(s, q, 'restock', { batch: { id: `b${i}`, expiryDate: rnd(3) ? `2027-0${rnd(9) + 1}-01` : null, receivedAt: i } }))
      else if (op === 1 && availableMilli(s) >= q) ledger.push(reserve(s, q))
      else if (op === 2 && s.reservedMilli > 0) ledger.push(release(s, Math.min(q, s.reservedMilli)))
      else if (op === 3 && s.reservedMilli >= q) ledger.push(deduct(s, q, 'sale', q))
      else if (op === 4) ledger.push(deduct(s, q, rnd(2) ? 'oversold' : 'damaged'))
      else { const m = count(s, rnd(100) * 100); if (m) ledger.push(m) }
      const problems = checkInvariants(s, ledger)
      if (problems.length) throw new Error(`step ${i} (trackExpiry=${trackExpiry}): ${problems.join('; ')}`)
    }
  }
})

done()
