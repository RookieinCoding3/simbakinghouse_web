// Stock engine end to end, over real HTTP against the emulator.
// Run inside scripts/test-env.sh.
import { randomBytes } from 'crypto'
import { BASE_URL, db, resetEmulators, createAdmin, signIn, check, assert, summary } from './lib/emu.mjs'
import { seedOrders } from './fixtures/orders.mjs'

await resetEmulators()
const sim = await createAdmin('sim@sbh.test', 'owner')
const token = () => signIn(sim.email)
const opId = () => randomBytes(8).toString('hex')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function api(method, path, body, { auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) headers.Authorization = `Bearer ${await token()}`
  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  return { status: res.status, json: await res.json().catch(() => ({})) }
}
const get = async (c, id) => (await db().collection(c).doc(id).get()).data() ?? null
const inv = (id) => get('inventory', id)
const product = (id) => get('products', id)
const order = (id) => get('orders', id)

let phoneSeq = 0
/** Places customer orders exactly as checkout does (form token, 3 s wait). */
async function placeOrders(list) {
  const tokens = await Promise.all(list.map(() => fetch(`${BASE_URL}/api/checkout/token`).then((r) => r.json())))
  await sleep(3100)
  return Promise.all(
    list.map(async (items, i) => {
      phoneSeq++
      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `198.51.100.${phoneSeq}` },
        body: JSON.stringify({
          customerName: 'Test', customerPhone: `60${String(120000000 + phoneSeq)}`, fulfilment: 'pickup',
          collectDate: new Date(Date.now() + 86400_000).toISOString().slice(0, 10), collectTime: '08:00', notes: '',
          items: items.map((it) => ({ name: 'x', ...it })), company: '',
          formIssuedAt: tokens[i].issuedAt, formToken: tokens[i].token,
        }),
      })
      return { status: res.status, json: await res.json().catch(() => ({})) }
    })
  )
}
const transition = (id, to, extra = {}) => api('POST', `/api/admin/orders/${id}/transition`, { to, ...extra })

// --- seed: old-format products and orders, exactly as they exist today ---
const OLD = {
  'p1': { name: 'Bread flour 1kg', price: 5.5, category: 'Flour', inStock: true, stockCount: 10 },
  'old-out': { name: 'Old out-of-stock tin', price: 12, category: 'Tools', inStock: false },
  'no-price': { name: 'Custom cake topper', category: 'Decorations', inStock: true },
  'old-plain': { name: 'Cocoa powder', price: 9.9, category: 'Baking', inStock: true, description: 'Dutch', imageUrl: '/x.jpg' },
}
for (const [id, data] of Object.entries(OLD)) await db().collection('products').doc(id).set(data)
await seedOrders(db())

async function createProduct(body) {
  const { status, json } = await api('POST', '/api/admin/products', body)
  assert(status === 201, `create ${body.name}: ${status} ${json.error}`)
  return json.id
}
const rice = await createProduct({
  name: 'Rice flour', category: 'Flour', baseUnit: 'kg', lowStockThresholdMilli: 3000, trackExpiry: false, barcodes: ['9555000000017'],
  sellUnits: [
    { id: 'kg1', label: '1 kg', factorMilli: 1000, priceSen: 650, channel: 'both' },
    { id: 'g500', label: '500 g pack', factorMilli: 500, priceSen: 350, channel: 'both' },
    { id: 'bag25', label: '25 kg bag', factorMilli: 25000, priceSen: 13000, channel: 'wholesale' },
  ],
})
const butter = await createProduct({
  name: 'Butter 250g', category: 'Dairy', baseUnit: 'pc', lowStockThresholdMilli: 2000, trackExpiry: true, barcodes: [],
  sellUnits: [{ id: 'pc', label: '1 block', factorMilli: 1000, priceSen: 1290, channel: 'both' }],
})

console.log('--- Old products and orders behave exactly as before ---')

await check('old products: orderable, priced from the legacy price, "ask for price" kept out of the total, no stock checks', async () => {
  const [r] = await placeOrders([[{ productId: 'p1', qty: 2 }, { productId: 'old-out', qty: 1 }, { productId: 'no-price', qty: 1 }]])
  assert(r.status === 201, `${r.status} ${r.json.error}`)
  const o = await order(r.json.orderId)
  assert(o.estimatedTotalSen === 2 * 550 + 1200, `total ${o.estimatedTotalSen}`)
  assert(o.items.find((i) => i.productId === 'no-price').unitPriceSen === null, 'no-price item priced')
  assert(!o.stock, 'order got a stock record')
})

await check('old products: no inventory doc, no stock fields were added to them', async () => {
  for (const [id, data] of Object.entries(OLD)) {
    assert((await inv(id)) === null, `inventory created for ${id}`)
    const p = await product(id)
    assert(JSON.stringify(p) === JSON.stringify(data), `${id} changed: ${JSON.stringify(p)}`)
  }
})

await check('an old order goes new → confirmed → paid → ready → collected with no stock records; legacy stockCount still decremented', async () => {
  for (const [to, extra] of [['confirmed', { confirmedTotalSen: 1100 }], ['paid'], ['ready'], ['collected']]) {
    const r = await transition('SBH-0101', to, extra)
    assert(r.status === 200, `${to}: ${r.status} ${r.json.error}`)
  }
  const o = await order('SBH-0101')
  assert(o.status === 'collected' && !o.stock, JSON.stringify(o.stock))
  assert((await product('p1')).stockCount === 8, 'legacy stockCount not decremented')
  assert((await inv('p1')) === null, 'inventory doc created')
})

await check('old-format orders (no items, legacy statuses) get a clear refusal, not an error', async () => {
  const pending = await transition('OLD-05', 'confirmed', { confirmedTotalSen: 0 }) // status "pending"
  assert(pending.status === 409 && /can't be marked/.test(pending.json.error), `${pending.status} ${pending.json.error}`)
  const cancel = await transition('SBH-0102', 'cancelled', { cancelReason: 'test' })
  assert(cancel.status === 200, `${cancel.status}`)
})

console.log('\n--- Switching to managed ---')

await check('switching on without a count is refused, naming the product', async () => {
  const r = await api('POST', '/api/admin/stock/manage', { opId: opId(), productIds: [rice], on: true, confirmOldSystemStopped: true })
  assert(r.status === 409 && /Rice flour/.test(r.json.error), `${r.status} ${r.json.error}`)
})

await check('a count on an unmanaged product only saves a draft — selling is unchanged', async () => {
  const r = await api('POST', '/api/admin/stock/count', { opId: opId(), counts: [{ productId: rice, countedMilli: 12000 }] })
  assert(r.status === 200 && r.json.drafts === 1, JSON.stringify(r.json))
  assert((await inv(rice)) === null && (await product(rice)).managedStock !== true, 'became managed')
})

await check('switching on without confirming the old system is stopped is refused', async () => {
  const r = await api('POST', '/api/admin/stock/manage', { opId: opId(), productIds: [rice], on: true })
  assert(r.status === 400, `${r.status}`)
})

await check('switching ONE product to managed changes only that product — nothing else in the catalogue', async () => {
  const snapshot = async () => {
    const ps = (await db().collection('products').get()).docs.filter((d) => d.id !== rice).map((d) => [d.id, d.data()])
    const is = (await db().collection('inventory').get()).docs.map((d) => [d.id, d.data()])
    return JSON.stringify({ ps: ps.sort(), is: is.sort() })
  }
  const before = await snapshot()
  const r = await api('POST', '/api/admin/stock/manage', { opId: opId(), productIds: [rice], on: true, confirmOldSystemStopped: true })
  assert(r.status === 200 && r.json.switched === 1, JSON.stringify(r.json))
  const after = await snapshot()
  const invAfter = (await db().collection('inventory').get()).docs.map((d) => d.id)
  assert(JSON.stringify(invAfter) === JSON.stringify([rice]), `inventory docs: ${invAfter}`)
  const others = JSON.parse(after).ps
  assert(JSON.stringify(JSON.parse(before).ps) === JSON.stringify(others), 'another product changed')
  const p = await product(rice)
  const i = await inv(rice)
  assert(p.managedStock === true && p.stockStatus === 'in_stock', JSON.stringify(p))
  assert(i.onHandMilli === 12000 && i.reservedMilli === 0, JSON.stringify(i))
  assert(!('onHandMilli' in p) && !('reservedMilli' in p), 'quantities leaked onto the public product doc')
  assert((await get('stockCountDrafts', rice)) === null, 'draft not cleared')
})

console.log('\n--- Online orders for a managed product ---')

await check('ordering more than is available is refused with a message that shows no quantities', async () => {
  const [r] = await placeOrders([[{ productId: rice, sellUnitId: 'kg1', qty: 13 }]])
  assert(r.status === 409 && /enough Rice flour/.test(r.json.error), `${r.status} ${r.json.error}`)
  assert(!/\d/.test(r.json.error), `message reveals a number: ${r.json.error}`)
})

await check('a wholesale-only size cannot be ordered online', async () => {
  const [r] = await placeOrders([[{ productId: rice, sellUnitId: 'bag25', qty: 1 }]])
  assert(r.status === 400 && /only sold in the shop/.test(r.json.error), `${r.status} ${r.json.error}`)
})

let heldOrder
await check('an order (2 x 1 kg + 1 x 500 g) is accepted, priced per size, and holds nothing yet', async () => {
  const [r] = await placeOrders([[{ productId: rice, sellUnitId: 'kg1', qty: 2 }, { productId: rice, sellUnitId: 'g500', qty: 1 }]])
  assert(r.status === 201, `${r.status} ${r.json.error}`)
  heldOrder = r.json.orderId
  const o = await order(heldOrder)
  assert(o.estimatedTotalSen === 2 * 650 + 350, `total ${o.estimatedTotalSen}`)
  assert(o.items.map((i) => i.baseQtyMilli).join() === '2000,500', 'base quantities wrong')
  assert((await inv(rice)).reservedMilli === 0, 'held at order time')
})

await check('confirm holds 2.5 kg; tapping confirm twice at once holds it only once', async () => {
  const [a, b] = await Promise.all([transition(heldOrder, 'confirmed', { confirmedTotalSen: 1650 }), transition(heldOrder, 'confirmed', { confirmedTotalSen: 1650 })])
  assert(a.status === 200 && b.status === 200, `${a.status}/${b.status}`)
  const i = await inv(rice)
  assert(i.onHandMilli === 12000 && i.reservedMilli === 2500, JSON.stringify(i))
  assert((await order(heldOrder)).stock.state === 'reserved', 'stock state')
})

await check('collected turns the hold into a sale (12 → 9.5 kg); collecting twice deducts once', async () => {
  await transition(heldOrder, 'paid')
  await transition(heldOrder, 'ready')
  const [a, b] = await Promise.all([transition(heldOrder, 'collected'), transition(heldOrder, 'collected')])
  assert(a.status === 200 && b.status === 200, `${a.status}/${b.status}`)
  const i = await inv(rice)
  assert(i.onHandMilli === 9500 && i.reservedMilli === 0, JSON.stringify(i))
})

await check('cancelling a confirmed order releases its hold; cancelling twice releases once', async () => {
  const [r] = await placeOrders([[{ productId: rice, sellUnitId: 'kg1', qty: 3 }]])
  await transition(r.json.orderId, 'confirmed', { confirmedTotalSen: 1950 })
  assert((await inv(rice)).reservedMilli === 3000, 'not held')
  await Promise.all([transition(r.json.orderId, 'cancelled', { cancelReason: 'changed mind' }), transition(r.json.orderId, 'cancelled', { cancelReason: 'changed mind' })])
  const i = await inv(rice)
  assert(i.reservedMilli === 0 && i.onHandMilli === 9500, JSON.stringify(i))
})

await check('confirm fails clearly — naming the item and amounts — when stock ran short since the order', async () => {
  const [r] = await placeOrders([[{ productId: rice, sellUnitId: 'kg1', qty: 9 }]])
  assert(r.status === 201, `order ${r.status}`)
  await api('POST', '/api/admin/stock/adjust', { opId: opId(), productId: rice, reason: 'damaged', qtyMilli: 2000, note: 'torn bag' })
  const c = await transition(r.json.orderId, 'confirmed', { confirmedTotalSen: 5850 })
  assert(c.status === 409 && /Rice flour \(need 9 kg, only 7.5 kg available\)/.test(c.json.error), `${c.status} ${c.json.error}`)
  assert((await order(r.json.orderId)).status === 'new', 'status changed anyway')
})

await check('customer-facing status follows stock: low at or below 3 kg, out at 0', async () => {
  await api('POST', '/api/admin/stock/adjust', { opId: opId(), productId: rice, reason: 'count', countedMilli: 2500 })
  assert((await product(rice)).stockStatus === 'low', 'not low')
  await api('POST', '/api/admin/stock/adjust', { opId: opId(), productId: rice, reason: 'count', countedMilli: 0 })
  assert((await product(rice)).stockStatus === 'out', 'not out')
  const [r] = await placeOrders([[{ productId: rice, sellUnitId: 'g500', qty: 1 }]])
  assert(r.status === 409 && /out of stock/.test(r.json.error), `${r.status} ${r.json.error}`)
  await api('POST', '/api/admin/stock/adjust', { opId: opId(), productId: rice, reason: 'restock', qtyMilli: 20000 })
  assert((await product(rice)).stockStatus === 'in_stock', 'not back in stock')
})

console.log('\n--- Stock adjustments ---')

await check('a double-tapped restock (same operation id) is applied once', async () => {
  const id = opId()
  const before = (await inv(rice)).onHandMilli
  const [a, b] = await Promise.all([
    api('POST', '/api/admin/stock/adjust', { opId: id, productId: rice, reason: 'restock', qtyMilli: 5000 }),
    api('POST', '/api/admin/stock/adjust', { opId: id, productId: rice, reason: 'restock', qtyMilli: 5000 }),
  ])
  assert(a.status === 200 && b.status === 200, `${a.status}/${b.status}`)
  assert((await inv(rice)).onHandMilli === before + 5000, 'applied twice')
})

await check('adjusting a product that is not managed is refused', async () => {
  const r = await api('POST', '/api/admin/stock/adjust', { opId: opId(), productId: 'old-plain', reason: 'restock', qtyMilli: 1000 })
  assert(r.status === 409, `${r.status}`)
})

console.log('\n--- Walk-in quick sale ---')

await check('a sale takes stock straight off the shelf; a double tap (same sale id) records it once', async () => {
  const before = (await inv(rice)).onHandMilli
  const saleId = opId()
  const body = { saleId, paymentMethod: 'cash', items: [{ productId: rice, sellUnitId: 'kg1', qty: 3 }] }
  const [a, b] = await Promise.all([api('POST', '/api/admin/sales', body), api('POST', '/api/admin/sales', body)])
  assert([a.status, b.status].sort().join() === '200,201', `${a.status}/${b.status}`)
  assert((await inv(rice)).onHandMilli === before - 3000, 'deducted twice or not at all')
  assert((await get('sales', saleId)).totalSen === 1950, 'total wrong')
})

await check('walk-in can sell the wholesale size at its wholesale price', async () => {
  const before = (await inv(rice)).onHandMilli
  const r = await api('POST', '/api/admin/sales', { saleId: opId(), paymentMethod: 'duitnow', items: [{ productId: rice, sellUnitId: 'bag25', qty: 1 }], sellAnyway: true })
  assert(r.status === 201 && r.json.totalSen === 13000, `${r.status} ${r.json.totalSen}`)
  assert((await inv(rice)).onHandMilli === before - 25000, 'wrong deduction')
})

await check('selling more than available is blocked, then "sell anyway" records it as oversold', async () => {
  const blocked = await api('POST', '/api/admin/sales', { saleId: opId(), paymentMethod: 'cash', items: [{ productId: rice, sellUnitId: 'kg1', qty: 50 }] })
  assert(blocked.status === 409 && blocked.json.canSellAnyway === true, `${blocked.status}`)
  const saleId = opId()
  const ok = await api('POST', '/api/admin/sales', { saleId, paymentMethod: 'cash', items: [{ productId: rice, sellUnitId: 'kg1', qty: 50 }], sellAnyway: true })
  assert(ok.status === 201, `${ok.status} ${ok.json.error}`)
  const m = (await db().collection('stockMovements').where('saleId', '==', saleId).get()).docs.map((d) => d.data().reason)
  assert(m.join() === 'oversold', `reasons: ${m}`)
  assert((await product(rice)).stockStatus === 'out', 'status not out after oversell')
})

await check('voiding a sale (same day) restores its stock; voiding twice changes nothing; the sale is kept', async () => {
  const before = (await inv(rice)).onHandMilli
  const saleId = opId()
  await api('POST', '/api/admin/sales', { saleId, paymentMethod: 'card', items: [{ productId: rice, sellUnitId: 'g500', qty: 4 }], sellAnyway: true })
  assert((await inv(rice)).onHandMilli === before - 2000, 'not deducted')
  const [a, b] = await Promise.all([
    api('POST', `/api/admin/sales/${saleId}/void`, { reason: 'wrong item' }),
    api('POST', `/api/admin/sales/${saleId}/void`, { reason: 'wrong item' }),
  ])
  assert(a.status === 200 && b.status === 200, `${a.status}/${b.status}`)
  assert((await inv(rice)).onHandMilli === before, 'not restored exactly once')
  assert((await get('sales', saleId)).status === 'voided', 'sale deleted or not marked')
})

await check('a sale of an unmanaged product is recorded without touching stock', async () => {
  const saleId = opId()
  const r = await api('POST', '/api/admin/sales', { saleId, paymentMethod: 'cash', items: [{ productId: 'old-plain', qty: 2 }] })
  assert(r.status === 201 && r.json.totalSen === 1980, `${r.status} ${r.json.totalSen}`)
  assert((await inv('old-plain')) === null, 'inventory created')
  assert(JSON.stringify(await product('old-plain')) === JSON.stringify(OLD['old-plain']), 'product changed')
})

await check('FEFO: a sale takes the soonest-expiring batch first; void puts it back in the same batches', async () => {
  await api('POST', '/api/admin/stock/count', { opId: opId(), counts: [{ productId: butter, countedMilli: 0 }] })
  await api('POST', '/api/admin/stock/manage', { opId: opId(), productIds: [butter], on: true, confirmOldSystemStopped: true })
  await api('POST', '/api/admin/stock/adjust', { opId: opId(), productId: butter, reason: 'restock', qtyMilli: 5000, expiryDate: '2027-03-01' })
  await api('POST', '/api/admin/stock/adjust', { opId: opId(), productId: butter, reason: 'restock', qtyMilli: 5000, expiryDate: '2026-12-01' })
  const saleId = opId()
  await api('POST', '/api/admin/sales', { saleId, paymentMethod: 'cash', items: [{ productId: butter, qty: 7 }] })
  const batches = async () => (await db().collection('batches').where('productId', '==', butter).get()).docs.map((d) => d.data()).filter((b) => b.expiryDate).sort((x, y) => x.expiryDate.localeCompare(y.expiryDate)).map((b) => `${b.expiryDate}:${b.qtyMilli}`).join(' ')
  assert((await batches()) === '2026-12-01:0 2027-03-01:3000', `after sale: ${await batches()}`)
  await api('POST', `/api/admin/sales/${saleId}/void`, { reason: 'test' })
  assert((await batches()) === '2026-12-01:5000 2027-03-01:5000', `after void: ${await batches()}`)
})

console.log('\n--- Switching back off ---')

await check('switching off: sells exactly like an old product again (no status, no checks); history is kept', async () => {
  const movementsBefore = (await db().collection('stockMovements').where('productId', '==', rice).get()).size
  const r = await api('POST', '/api/admin/stock/manage', { opId: opId(), productIds: [rice], on: false })
  assert(r.status === 200, `${r.status}`)
  const p = await product(rice)
  assert(p.managedStock === false && !('stockStatus' in p), JSON.stringify(p))
  assert((await inv(rice)) !== null, 'inventory deleted')
  assert((await db().collection('stockMovements').where('productId', '==', rice).get()).size === movementsBefore, 'history changed')
  const [o] = await placeOrders([[{ productId: rice, sellUnitId: 'kg1', qty: 99 }]])
  assert(o.status === 201, `unmanaged order refused: ${o.status} ${o.json.error}`)
})

console.log('\n--- Books balance ---')

await check('consistency check: every inventory total equals its ledger, and batches equal on-hand', async () => {
  const r = await api('GET', '/api/admin/stock/check')
  assert(r.status === 200 && r.json.ok === true && r.json.checked >= 2, JSON.stringify(r.json))
})

await check('none of these routes work for a signed-out caller', async () => {
  for (const [m, p] of [['POST', '/api/admin/stock/adjust'], ['POST', '/api/admin/stock/manage'], ['POST', '/api/admin/sales'], ['POST', `/api/admin/orders/${heldOrder}/transition`], ['POST', '/api/admin/products']]) {
    const r = await api(m, p, {}, { auth: false })
    assert(r.status === 401, `${p}: ${r.status}`)
  }
})

process.exit(summary() > 0 ? 1 : 0)
