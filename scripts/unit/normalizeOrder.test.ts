import { Timestamp } from 'firebase-admin/firestore'
import {
  normalizeOrder,
  formatRM,
  formatCollectDate,
  formatCollectTime,
  formatCreatedAt,
} from '../../lib/admin/normalizeOrder'
import { test, eq, ok, done } from './harness'

const weird: [string, unknown][] = [
  ['undefined doc', undefined],
  ['null doc', null],
  ['string doc', 'oops'],
  ['empty object', {}],
  ['items missing', { status: 'cancelled', estimatedTotal: 5 }],
  ['items null', { status: 'cancelled', items: null }],
  ['items not array', { items: 'flour' }],
  ['items with nulls', { items: [null, 3, { qty: '2' }] }],
  ['string total', { estimatedTotal: '12.50', items: [] }],
  ['garbage total', { estimatedTotal: 'abc', items: [] }],
  ['timestamp date', { createdAt: Timestamp.fromMillis(0), items: [] }],
  ['seconds object date', { createdAt: { seconds: 1700000000, nanoseconds: 0 }, items: [] }],
  ['bad date string', { createdAt: 'yesterday', items: [] }],
  ['legacy status', { status: 'pending' }],
  ['capitalised status', { status: 'Cancelled' }],
  ['status not a string', { status: 7 }],
  ['statusHistory junk', { statusHistory: [null, 'x', { status: 'new' }] }],
]

for (const [name, raw] of weird) {
  test(`normalizes without throwing: ${name}`, () => {
    const o = normalizeOrder('DOC-1', raw)
    ok(Array.isArray(o.items), 'items not an array')
    ok(typeof o.itemCount === 'number' && Number.isFinite(o.itemCount), 'itemCount not finite')
    ok(typeof o.orderId === 'string' && o.orderId.length > 0, 'no orderId')
    // Every formatter the admin calls must cope with whatever came out.
    formatRM(o.estimatedTotal)
    formatRM(o.confirmedTotal)
    formatCollectDate(o.collectDate)
    formatCollectTime(o.collectTime)
    formatCreatedAt(o.createdAt)
  })
}

test('string total "12.50" is read as 12.5 and flagged', () => {
  const o = normalizeOrder('X', { estimatedTotal: '12.50', items: [] })
  eq(o.estimatedTotal, 12.5)
  ok(o.problems.some((p) => p.includes('text')), 'not flagged')
})

test('missing items → [] and flagged', () => {
  const o = normalizeOrder('X', { status: 'new' })
  eq(o.items, [])
  ok(o.problems.includes('no items list'), 'not flagged')
})

test('"Cancelled" maps to cancelled; "pending" maps to null status but keeps the raw value', () => {
  eq(normalizeOrder('X', { status: 'Cancelled' }).status, 'cancelled')
  const p = normalizeOrder('X', { status: 'pending' })
  eq(p.status, null)
  eq(p.rawStatus, 'pending')
})

test('orderId falls back to the document id', () => {
  eq(normalizeOrder('OLD-10', { status: 'new' }).orderId, 'OLD-10')
})

test('item qty "3" → 3; missing name → "Unnamed item"; missing price → null', () => {
  const o = normalizeOrder('X', { items: [{ productId: 'p', qty: '3' }] })
  eq(o.items[0], { productId: 'p', name: 'Unnamed item', qty: 3, unitPrice: null })
  eq(o.itemCount, 3)
})

test('confirmedTotal undefined → null (the detail page used to call .toFixed on it)', () => {
  eq(normalizeOrder('X', { items: [] }).confirmedTotal, null)
})

test('formatters: null-safe, and pass unparseable values through unchanged', () => {
  eq(formatRM(null), 'RM —')
  eq(formatRM(11), 'RM 11.00')
  eq(formatCollectDate('10/10/2025'), '10/10/2025')
  eq(formatCollectTime('morning'), 'morning')
  eq(formatCollectTime('08:00'), '8:00 AM')
  eq(formatCollectTime('13:05'), '1:05 PM')
  eq(formatCollectDate(null), '')
})

done()
