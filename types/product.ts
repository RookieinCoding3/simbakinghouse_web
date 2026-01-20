export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  category: string
  featured: boolean
  inStock: boolean
  stockQuantity: number
  createdAt?: Date
  updatedAt?: Date
}

export interface Category {
  id: string
  name: string
  description?: string
  imageUrl?: string
  order?: number
}
