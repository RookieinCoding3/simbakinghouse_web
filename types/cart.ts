export interface CartItem {
  productId: string
  name: string
  imageUrl: string
  /** null = "Ask for price" — kept in the cart but excluded from the subtotal */
  unitPrice: number | null
  qty: number
  /** Absent in carts saved before sell units existed = the product's first size. */
  sellUnitId?: string
  sellUnitLabel?: string
}

/** One cart line per product AND size. */
export function cartLineKey(item: Pick<CartItem, 'productId' | 'sellUnitId'>): string {
  return `${item.productId}::${item.sellUnitId ?? ''}`
}
