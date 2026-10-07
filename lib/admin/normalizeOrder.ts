import type { OrderStatus } from '@/types/order'

// Firestore data is untyped at runtime. Orders written by earlier versions
// of this app, the iOS admin, or by hand in the Console don't all have the
// shape types/order.ts describes — a missing `items`, a string total, a
// Timestamp instead of an ISO date. The admin used to cast raw docs `as
// Order` and call e.g. order.items.reduce(...) directly, so one such doc
// crashed the whole app. Everything the admin renders goes through here.

export const KNOWN_STATUSES: OrderStatus[] = ['new', 'confirmed', 'paid', 'ready', 'collected', 'cancelled']

export interface AdminOrderItem {
  productId: string
  name: string
  qty: number
  unitPrice: number | null
  /** Size the customer picked ("1 kg", "Bag of 25 kg"); '' on old orders. */
  sizeLabel: string
}

export interface AdminOrder {
  docId: string
  orderId: string
  /** A known status, or null when the stored value isn't one of them. */
  status: OrderStatus | null
  /** Exactly what's stored, for display when status is null. */
  rawStatus: string
  customerName: string
  customerPhone: string
  fulfilment: 'pickup' | 'delivery' | null
  collectDate: string | null
  collectTime: string | null
  notes: string
  items: AdminOrderItem[]
  itemCount: number
  estimatedTotal: number | null
  /** Some lines are "Ask for price": estimatedTotal leaves them out. */
  priceToConfirm: boolean
  confirmedTotal: number | null
  cancelReason: string
  /** What happened to stock for this order (managed products only). */
  stockState: 'reserved' | 'deducted' | 'released' | null
  createdAt: Date | null
  statusHistory: { status: string; at: string }[]
  /** Human-readable list of anything that had to be patched — shown as a "legacy data" hint. */
  problems: string[]
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return null
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  // Firestore Timestamp (client or admin SDK) — duck-typed so this file
  // doesn't need to import either SDK.
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
    try {
      return toDate((value as { toDate: () => Date }).toDate())
    } catch {
      return null
    }
  }
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    const s = toNumber((value as { seconds: unknown }).seconds)
    return s === null ? null : new Date(s * 1000)
  }
  return null
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function stockStateOf(value: unknown): AdminOrder['stockState'] {
  const state = value && typeof value === 'object' ? (value as { state?: unknown }).state : null
  return state === 'reserved' || state === 'deducted' || state === 'released' ? state : null
}

export function normalizeOrder(docId: string, raw: unknown): AdminOrder {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const problems: string[] = []

  const rawStatus = typeof d.status === 'string' ? d.status : ''
  const lowered = rawStatus.toLowerCase() as OrderStatus
  const status = KNOWN_STATUSES.includes(lowered) ? lowered : null
  if (!status) problems.push(rawStatus ? `unknown status "${rawStatus}"` : 'no status')
  else if (rawStatus !== lowered) problems.push(`status stored as "${rawStatus}"`)

  let items: AdminOrderItem[] = []
  if (Array.isArray(d.items)) {
    items = d.items
      .filter((it): it is Record<string, unknown> => !!it && typeof it === 'object')
      .map((it) => ({
        productId: str(it.productId),
        name: str(it.name) || 'Unnamed item',
        qty: Math.max(0, Math.round(toNumber(it.qty) ?? 0)),
        unitPrice: toNumber(it.unitPriceSnapshot),
        // The built-in size of an old product ("1 pc") says nothing: hide it.
        sizeLabel: it.sellUnitId === 'default' ? '' : str(it.sellUnitLabel),
      }))
  } else {
    problems.push('no items list')
  }

  const estimatedTotal = toNumber(d.estimatedTotal)
  if (d.estimatedTotal !== undefined && d.estimatedTotal !== null && typeof d.estimatedTotal !== 'number') {
    problems.push('total stored as text')
  }

  const createdAt = toDate(d.createdAt)
  if (d.createdAt && typeof d.createdAt !== 'string') problems.push('date stored in an old format')

  const fulfilment = d.fulfilment === 'pickup' || d.fulfilment === 'delivery' ? d.fulfilment : null

  return {
    docId,
    orderId: str(d.orderId) || docId,
    status,
    rawStatus,
    customerName: str(d.customerName) || '(no name)',
    customerPhone: str(d.customerPhone),
    fulfilment,
    collectDate: str(d.collectDate) || null,
    collectTime: str(d.collectTime) || null,
    notes: str(d.notes),
    items,
    itemCount: items.reduce((n, i) => n + i.qty, 0),
    estimatedTotal,
    priceToConfirm: d.priceToConfirm === true || items.some((i) => i.unitPrice === null),
    confirmedTotal: toNumber(d.confirmedTotal),
    cancelReason: str(d.cancelReason),
    stockState: stockStateOf(d.stock),
    createdAt,
    statusHistory: Array.isArray(d.statusHistory)
      ? d.statusHistory
          .filter((h): h is Record<string, unknown> => !!h && typeof h === 'object')
          .map((h) => ({ status: str(h.status), at: str(h.at) }))
      : [],
    problems,
  }
}

export function formatRM(value: number | null): string {
  return value === null ? 'RM —' : `RM ${value.toFixed(2)}`
}

/** "2026-10-12" -> "12 Oct 2026"; anything unparseable is shown as-is. */
export function formatCollectDate(value: string | null): string {
  if (!value) return ''
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return value
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** "08:00" -> "8:00 AM"; anything unparseable is shown as-is. */
export function formatCollectTime(value: string | null): string {
  if (!value) return ''
  const m = value.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return value
  const h = Number(m[1])
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`
}

export function formatCreatedAt(value: Date | null): string {
  if (!value) return ''
  return value.toLocaleString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}
