export type OrderStatus = 'new' | 'confirmed' | 'paid' | 'ready' | 'collected' | 'cancelled'
export type Fulfilment = 'pickup' | 'delivery'

export interface OrderItem {
  productId: string
  name: string
  qty: number
  unitPriceSnapshot: number | null
}

export interface StatusHistoryEntry {
  status: OrderStatus
  at: string // ISO timestamp
}

/** Firestore shape, as written by app/api/orders. */
export interface Order {
  orderId: string
  status: OrderStatus
  customerName: string
  customerPhone: string // 60XXXXXXXXX
  phoneLast4: string
  fulfilment: Fulfilment
  collectDate: string | null // YYYY-MM-DD
  collectTime: string | null // HH:MM
  notes: string
  items: OrderItem[]
  // Display only — computed from items at write time. NEVER the authoritative
  // charge. The real amount the customer pays is confirmedTotal, set by the
  // owner in admin (Phase 4). Do not use estimatedTotal anywhere a charge is
  // decided or displayed as final.
  estimatedTotal: number
  confirmedTotal: number | null
  cancelReason?: string
  createdAt: string
  updatedAt: string
  statusHistory: StatusHistoryEntry[]
}

/** What GET /api/orders/[orderId] returns to a verified customer — never the
 *  full phone number or anything beyond what the status page needs to show. */
export interface PublicOrderView {
  orderId: string
  status: OrderStatus
  fulfilment: Fulfilment
  collectDate: string | null
  collectTime: string | null
  items: OrderItem[]
  estimatedTotal: number
  confirmedTotal: number | null
  cancelReason?: string
  createdAt: string
}
