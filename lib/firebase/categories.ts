import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from './config'
import type { Category } from '@/types/product'

/**
 * Fetch categories from the Firestore 'categories' collection
 * @returns Promise<Category[]> - Array of category objects
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const categoriesRef = collection(db, 'categories')

    // Try to order by 'order' field if it exists, otherwise by name
    let q
    try {
      q = query(categoriesRef, orderBy('order', 'asc'))
    } catch (orderError) {
      try {
        q = query(categoriesRef, orderBy('name', 'asc'))
      } catch {
        q = categoriesRef
      }
    }

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return []
    }

    const categories: Category[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()

      const category: Category = {
        id: doc.id,
        name: data.name || data.Name || 'Uncategorized',
        description: data.description || data.Description || '',
        imageUrl: data.imageUrl || data.image || data.imageURL || '',
        order: data.order ?? 0,
      }

      categories.push(category)
    })

    return categories

  } catch (error: any) {
    return []
  }
}

/**
 * Get unique categories from products
 * This is a fallback if categories collection doesn't exist
 * @param products - Array of products
 * @returns Array of unique category names
 */
export function getUniqueCategoriesFromProducts(products: { category: string }[]): string[] {
  const categories = new Set<string>()
  products.forEach(product => {
    if (product.category) {
      categories.add(product.category)
    }
  })
  return Array.from(categories).sort()
}
