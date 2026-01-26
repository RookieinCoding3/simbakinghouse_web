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
  // Mentor-focused fields (optional for backward compatibility)
  mentorNote?: string
  badges?: string[]
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced'
}

export type BadgeType =
  | 'sims-secret'
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
