// SBH Inventory integration on the website: order types and courier pickup,
// availability from publicCatalog, and orders the iPad holds.
import { validateOrderInput } from '../../lib/orderValidation'
import { productAvailability, STOCK_LABEL } from '../../lib/productView'
import { normalizeOrder } from '../../lib/admin/normalizeOrder'
import { draftProblems, parseDraftCompletion } from '../../lib/server/draftInput'
import { assertProjectAllowed } from '../../lib/firebase/envGuard'
import type { Product } from '../../types/product'
import { test, eq, ok, done } from './harness'

const tomorrow = (() => {
  const d = new Date(Date.now() + 86400000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})()
const body = (extra: Record<string, unknown>) => ({
  customerName: 'Mei Ling',
  customerPhone: '0123456789',
  collectDate: tomorrow,
  collectTime: '10:00',
  items: [{ productId: 'p1', name: 'Flour', qty: 2 }],
  ...extra,
})
const hours = { shopOpensAt: '6:30 AM', shopClosesAt: '1:00 PM' }

test('pickup still works', () => {
  const r = validateOrderInput(body({ fulfilment: 'pickup' }), hours)
  ok(r.ok, JSON.stringify(r))
  if (r.ok) eq(r.data.courierNote, '')
})

test('courier pickup keeps the courier note (trimmed, capped)', () => {
  const r = validateOrderInput(body({ fulfilment: 'courier_pickup', courierNote: '  Grab at 11am  ' }), hours)
  ok(r.ok, JSON.stringify(r))
  if (r.ok) {
    eq(r.data.fulfilment, 'courier_pickup')
    eq(r.data.courierNote, 'Grab at 11am')
  }
  const long = validateOrderInput(body({ fulfilment: 'courier_pickup', courierNote: 'x'.repeat(1000) }), hours)
  ok(long.ok && long.data.courierNote.length === 300, 'note capped at 300')
})

test('a type switched off on the iPad is refused; delivery is no longer offered', () => {
  const off = validateOrderInput(body({ fulfilment: 'courier_pickup' }), hours, { pickup: true, courierPickup: false })
  ok(!off.ok, 'courier off but accepted')
  const pickupOff = validateOrderInput(body({ fulfilment: 'pickup' }), hours, { pickup: false, courierPickup: true })
  ok(!pickupOff.ok, 'pickup off but accepted')
  ok(!validateOrderInput(body({ fulfilment: 'delivery' }), hours).ok, 'delivery accepted')
})

test('a collection date is needed for both kinds of pickup', () => {
  ok(!validateOrderInput(body({ fulfilment: 'courier_pickup', collectDate: '' }), hours).ok, 'no date accepted')
})

const product = (extra: Partial<Product>): Product => ({
  id: 'p1', name: 'Flour', description: '', imageUrl: '', category: 'Flour', featured: false, inStock: true, ...extra,
})

test('availability from the iPad decides; no numbers', () => {
  eq(productAvailability(product({ availability: 'in_stock' })), { sellable: true, status: 'in_stock' })
  eq(productAvailability(product({ availability: 'low' })), { sellable: true, status: 'low' })
  eq(productAvailability(product({ availability: 'out', inStock: true })), { sellable: false, status: 'out' })
  eq(STOCK_LABEL.ask_us, 'Ask us')
})

test('"Ask us" still respects the old manual In-stock switch', () => {
  eq(productAvailability(product({ availability: 'ask_us', inStock: true })), { sellable: true, status: 'ask_us' })
  eq(productAvailability(product({ availability: 'ask_us', inStock: false })), { sellable: false, status: 'out' })
})

test('no catalogue entry: the shop behaves exactly as before', () => {
  eq(productAvailability(product({ inStock: false })), { sellable: false, status: null })
})

test('admin reads iPad statuses, courier notes and holds', () => {
  const o = normalizeOrder('x', {
    orderId: 'SBH-1', status: 'awaiting_payment', fulfilment: 'courier_pickup', courierNote: 'Lalamove', items: [],
    inv: { state: 'reserved', locationId: 'storeroom', lines: [] },
  })
  eq(o.status, 'awaiting_payment')
  eq(o.fulfilment, 'courier_pickup')
  eq(o.courierNote, 'Lalamove')
  eq(o.heldOnIpad, true)
  eq(o.problems.length, 0)
})

test('a Vercel Preview refuses the production Firebase project; production and local are unaffected', () => {
  const throws = (f: () => void) => {
    try {
      f()
      return false
    } catch {
      return true
    }
  }
  ok(throws(() => assertProjectAllowed('sim-baking-house', 'preview')), 'preview + prod must refuse')
  ok(!throws(() => assertProjectAllowed('sim-baking-house-test', 'preview')), 'preview + staging is fine')
  ok(!throws(() => assertProjectAllowed('sim-baking-house', 'production')), 'production is unaffected')
  ok(!throws(() => assertProjectAllowed('sim-baking-house', '')), 'local dev is unaffected')
  ok(!throws(() => assertProjectAllowed('demo-sbh-test', 'preview')), 'emulator projects are fine')
})

test('a draft with no price or quantity 0 cannot be completed (same rule as the iPad)', () => {
  eq(draftProblems(450, 1000), { noPrice: false, noQty: false })
  eq(draftProblems(null, 1000), { noPrice: true, noQty: false })
  eq(draftProblems(0, 1000).noPrice, true)
  eq(draftProblems(450, 0), { noPrice: false, noQty: true })
  eq(draftProblems(450, -2000).noQty, true)
})

test('complete a draft: names, category and repack checked; prices in sen', () => {
  const ok1 = parseDraftCompletion({ name: ' Cake flour ', nameZh: '低筋面粉', categoryId: 'flour', unitLabel: 'pack', kind: 'standard', sellPriceSen: 450, costSen: 300 })
  eq(ok1.name, 'Cake flour')
  eq(ok1.sellPriceSen, 450)
  eq(ok1.costSen, 300)
  eq(ok1.repackSourceProductId, null)
  eq(parseDraftCompletion({ nameZh: '低筋面粉', categoryId: 'flour' }).name, '低筋面粉')
  const rep = parseDraftCompletion({ name: 'AP 1kg', categoryId: 'flour', kind: 'repack', repackSourceProductId: 'bag', repackYield: 25 })
  eq([rep.repackSourceProductId, rep.repackYield], ['bag', 25])
  const refuses = (b: Record<string, unknown>) => {
    try {
      parseDraftCompletion(b)
      return false
    } catch {
      return true
    }
  }
  ok(refuses({ categoryId: 'flour' }), 'no name accepted')
  ok(refuses({ name: 'x' }), 'no category accepted')
  ok(refuses({ name: 'x', categoryId: 'c', kind: 'repack', repackYield: 25 }), 'repack without source accepted')
  ok(refuses({ name: 'x', categoryId: 'c', kind: 'repack', repackSourceProductId: 'b', repackYield: 0 }), 'zero yield accepted')
  ok(refuses({ name: 'x', categoryId: 'c', sellPriceSen: 4.5 }), 'float price accepted')
})

done()
