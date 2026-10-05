import type { AdminOrder } from './normalizeOrder'

// Last-seen first page of each orders tab, so reopening the admin paints
// rows immediately (stale-while-revalidate) instead of waiting for auth
// restore + the Firestore handshake. Display fields only — no phone
// numbers or notes — and wiped on sign-out (see AdminSession).
const KEY = 'sbh-admin-orders-cache-v1'

type Cached = Omit<AdminOrder, 'createdAt' | 'customerPhone' | 'notes'> & { createdAt: string | null }

function readAll(): Record<string, Cached[]> {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Record<string, Cached[]>) : {}
  } catch {
    return {}
  }
}

export function loadCachedOrders(tab: string): AdminOrder[] | null {
  const list = readAll()[tab]
  if (!Array.isArray(list)) return null
  return list.map((o) => ({
    ...o,
    customerPhone: '',
    notes: '',
    createdAt: o.createdAt ? new Date(o.createdAt) : null,
  }))
}

export function saveCachedOrders(tab: string, orders: AdminOrder[]) {
  try {
    const all = readAll()
    all[tab] = orders.map(({ customerPhone: _p, notes: _n, createdAt, ...rest }) => ({
      ...rest,
      createdAt: createdAt ? createdAt.toISOString() : null,
    }))
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // Storage full/blocked: just no instant paint next time.
  }
}

export function clearCachedOrders() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}
