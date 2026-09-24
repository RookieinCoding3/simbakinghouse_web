export interface CartItem {
  productId: string
  name: string
  imageUrl: string
  /** null = "Ask for price" — kept in the cart but excluded from the subtotal */
  unitPrice: number | null
  qty: number
}
