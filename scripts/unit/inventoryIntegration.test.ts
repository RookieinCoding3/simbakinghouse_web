// SBH Inventory integration on the website: order types and courier pickup,
// availability from publicCatalog, and orders the iPad holds.
import { validateOrderInput } from '../../lib/orderValidation'
import { productAvailability, STOCK_LABEL } from '../../lib/productView'
import { normalizeOrder } from '../../lib/admin/normalizeOrder'
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

done()
