import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from './config'
import type { Category } from '@/types/product'

/**
 * Fetch categories from the Firestore 'categories' collection
 * @returns Promise<Category[]> - Array of category objects
 */
export async function fetchCategories(): Promise<Category[]> {
  console.log('🔥 Firebase: Starting categories fetch...')

  try {
    const categoriesRef = collection(db, 'categories')

    // Try to order by 'order' field if it exists, otherwise by name
    let q
    try {
      q = query(categoriesRef, orderBy('order', 'asc'))
      console.log('✓ Query built with orderBy(order)')
    } catch (orderError) {
      try {
        q = query(categoriesRef, orderBy('name', 'asc'))
        console.log('✓ Query built with orderBy(name)')
      } catch {
        q = categoriesRef
        console.log('✓ Query without ordering')
      }
    }

    const querySnapshot = await getDocs(q)
    console.log(`✓ Query completed! Found ${querySnapshot.size} categories`)

    if (querySnapshot.empty) {
      console.warn('⚠️ No categories found in Firestore collection "categories"')
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

    console.log(`✅ Successfully fetched ${categories.length} categories`)
    return categories

  } catch (error: any) {
    console.error('❌ Firestore Error fetching categories:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)

    // Return empty array instead of throwing to allow graceful degradation
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
