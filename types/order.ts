// 'awaiting_payment' is set by the SBH Inventory iPad app (Request payment).
export type OrderStatus = 'new' | 'confirmed' | 'awaiting_payment' | 'paid' | 'ready' | 'collected' | 'cancelled'
// New orders are 'pickup' or 'courier_pickup' (the customer books Grab /
// Lalamove). 'delivery' is kept so older orders still read.
export type Fulfilment = 'pickup' | 'courier_pickup' | 'delivery'

/** Stock held by the SBH Inventory iPad app for this order (it, not the
 *  web admin, moves such an order through its steps). */
export interface InventoryHold {
  state: 'reserved' | 'collected' | 'released'
  locationId: string
  lines: { productId: string; qtyMilli: number }[]
}

export interface OrderItem {
  productId: string
  name: string
  qty: number
  /** RM float, kept for older readers. New orders also carry unitPriceSen. */
  unitPriceSnapshot: number | null
  // Added with sell units (Phase 2); absent on older orders.
  sellUnitId?: string
  sellUnitLabel?: string
  factorMilli?: number
  baseQtyMilli?: number
  unitPriceSen?: number | null
}

/** What this order holds or took from stock. Absent = never touched stock
 *  (every order placed before Phase 2, and orders of unmanaged products). */
export interface OrderStock {
  state: 'reserved' | 'deducted' | 'released'
  lines: { productId: string; qtyMilli: number }[]
}

export interface StatusHistoryEntry {
  status: OrderStatus
  at: string // ISO timestamp
}

/** Firestore shape, as written by app/api/orders. */
export interface Order {
  orderId: string
  status: OrderStatus
  /** Firebase Auth uid, when the order was placed while signed in. Null for
   *  guest checkout — guest checkout keeps working unchanged either way. */
  userId?: string | null
  customerName: string
  customerPhone: string // 60XXXXXXXXX
  phoneLast4: string
  fulfilment: Fulfilment
  /** Courier booking details, for 'courier_pickup'. */
  courierNote?: string
  collectDate: string | null // YYYY-MM-DD
  collectTime: string | null // HH:MM
  notes: string
  items: OrderItem[]
  // Display only — computed from items at write time. NEVER the authoritative
  // charge. The real amount the customer pays is confirmedTotal, set by the
  // owner in admin (Phase 4). Do not use estimatedTotal anywhere a charge is
  // decided or displayed as final.
  estimatedTotal: number
  estimatedTotalSen?: number
  /** True when at least one line is "Ask for price" (unitPriceSnapshot
   *  null): estimatedTotal leaves those lines out, so the owner must set
   *  the price before confirming. Missing on orders written before this. */
  priceToConfirm?: boolean
  confirmedTotal: number | null
  stock?: OrderStock
  inv?: InventoryHold
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
  priceToConfirm?: boolean
  confirmedTotal: number | null
  cancelReason?: string
  createdAt: string
  /** Short-lived signed URL, only present for 'confirmed'/'ready' orders
   *  when a QR has been uploaded. Never a public/permanent URL. */
  duitNowQrUrl?: string
}
