export interface Product {
  id: string
  name: string
  description: string
  /** undefined means no price has been set — show "Ask for price", never hide the card */
  price?: number
  imageUrl: string
  category: string
  featured: boolean
  inStock: boolean
  /** Optional. undefined = stock tracking is off for this product — never
   *  block a sale on it. Never shown to customers, only used by admin
   *  (decremented on the 'collected' transition) — see app/admin/orders. */
  stockCount?: number
  /** Stock is managed in the admin. Missing = false: the product sells
   *  exactly as before, using the manual inStock flag. */
  managedStock?: boolean
  /** Public, derived by the server for managed products only — never a number. */
  stockStatus?: 'in_stock' | 'low' | 'out'
  /** Sizes sold online (public). Old products get one default size. */
  sellUnits?: PublicSellUnit[]
  /** Larger wholesale sizes exist — sold in the shop / on WhatsApp only. */
  hasWholesale?: boolean
  createdAt?: Date
  updatedAt?: Date
  // Mentor-focused fields (optional for backward compatibility)
  mentorNote?: string
  badges?: string[]
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced'
}

export interface PublicSellUnit {
  id: string
  label: string
  factorMilli: number
  priceSen: number | null
  channel: 'online' | 'wholesale' | 'both'
}

export type BadgeType =
  | 'beginner-friendly'
  | 'sourdough-essential'
  | 'sims-choice'

export interface Category {
  id: string
  name: string
  description?: string
  imageUrl?: string
  order?: number
}
