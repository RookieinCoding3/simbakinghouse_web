// Orders for admin E2E tests: a set of current-format orders, plus every
// "old format" shape the live collection might plausibly contain from
// earlier versions of the app / the iOS admin / hand edits in the Console.
import { Timestamp } from 'firebase-admin/firestore'

const iso = (daysAgo) => new Date(Date.now() - daysAgo * 86400_000).toISOString()

function current(id, status, daysAgo, extra = {}) {
  return {
    orderId: id,
    status,
    userId: null,
    customerName: `Customer ${id}`,
    customerPhone: '60123456789',
    phoneLast4: '6789',
    fulfilment: 'pickup',
    collectDate: '2026-10-10',
    collectTime: '08:00',
    notes: '',
    items: [{ productId: 'p1', name: 'Flour 1kg', qty: 2, unitPriceSnapshot: 5.5 }],
    estimatedTotal: 11,
    confirmedTotal: status === 'new' ? null : 11,
    createdAt: iso(daysAgo),
    updatedAt: iso(daysAgo),
    statusHistory: [{ status: 'new', at: iso(daysAgo) }],
    ...extra,
  }
}

export const CURRENT_ORDERS = [
  current('SBH-0101', 'new', 1),
  current('SBH-0102', 'confirmed', 2),
  current('SBH-0103', 'paid', 3),
  current('SBH-0104', 'ready', 4),
  current('SBH-0105', 'collected', 5),
  current('SBH-0106', 'cancelled', 6, { cancelReason: 'Customer changed mind' }),
]

// Each of these is a shape the admin list/detail must render without
// crashing. Comments name the field that's off.
export const OLD_ORDERS = [
  // items missing entirely
  { orderId: 'OLD-01', status: 'cancelled', customerName: 'No items', createdAt: iso(30), estimatedTotal: 5 },
  // items null, estimatedTotal missing
  { orderId: 'OLD-02', status: 'cancelled', customerName: 'Null items', items: null, createdAt: iso(31) },
  // estimatedTotal as a string, confirmedTotal undefined (not null)
  {
    orderId: 'OLD-03', status: 'collected', customerName: 'String total', createdAt: iso(32),
    items: [{ productId: 'p1', name: 'Flour', qty: 1, unitPriceSnapshot: 5 }], estimatedTotal: '12.50',
  },
  // createdAt as a Firestore Timestamp instead of an ISO string
  {
    orderId: 'OLD-04', status: 'cancelled', customerName: 'Timestamp date', createdAt: Timestamp.fromDate(new Date(Date.now() - 33 * 86400_000)),
    items: [{ productId: 'p1', name: 'Flour', qty: 1 }], estimatedTotal: 5, confirmedTotal: null,
  },
  // odd / legacy statuses
  { orderId: 'OLD-05', status: 'pending', customerName: 'Legacy status', createdAt: iso(34), items: [], estimatedTotal: 0 },
  { orderId: 'OLD-06', status: 'Cancelled', customerName: 'Capitalised status', createdAt: iso(35), items: [], estimatedTotal: 0 },
  // no status at all, no customerName, items with string qty and no name
  { orderId: 'OLD-07', createdAt: iso(36), items: [{ productId: 'p2', qty: '3' }], estimatedTotal: null },
  // collect date/time null, unitPriceSnapshot missing (undefined, not null)
  {
    orderId: 'OLD-08', status: 'cancelled', customerName: 'Null dates', collectDate: null, collectTime: null,
    createdAt: iso(37), items: [{ productId: 'p3', name: 'Tin', qty: 2 }], estimatedTotal: 4,
  },
  // malformed date strings
  {
    orderId: 'OLD-09', status: 'collected', customerName: 'Bad dates', collectDate: '10/10/2025', collectTime: 'morning',
    createdAt: iso(38), items: [{ productId: 'p1', name: 'Flour', qty: 1, unitPriceSnapshot: 5 }], estimatedTotal: 5,
  },
  // statusHistory missing, orderId field missing (only the doc id exists)
  { status: 'cancelled', customerName: 'No orderId field', createdAt: iso(39), items: [], estimatedTotal: 1, __docId: 'OLD-10' },
]

export async function seedOrders(db, { includeOld = true } = {}) {
  const batch = db.batch()
  for (const o of [...CURRENT_ORDERS, ...(includeOld ? OLD_ORDERS : [])]) {
    const { __docId, ...data } = o
    batch.set(db.collection('orders').doc(__docId ?? o.orderId), data)
  }
  await batch.commit()
}
