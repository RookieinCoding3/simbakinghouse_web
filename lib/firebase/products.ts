import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from './config'
import type { Product } from '@/types/product'

/**
 * Fetch all products from the Firestore 'products' collection
 * @returns Promise<Product[]> - Array of product objects
 */
export async function fetchProducts(): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'products')
    const q = query(productsRef, orderBy('name', 'asc'))
    const querySnapshot = await getDocs(q)

    const products: Product[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      products.push({
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        price: data.price || 0,
        imageUrl: data.imageUrl || data.image || '/images/placeholder-product.jpg',
      })
    })

    return products
  } catch (error) {
    console.error('Error fetching products:', error)
    throw new Error('Failed to fetch products from Firestore')
  }
}

/**
 * Fetch a single product by ID
 * @param id - The product document ID
 * @returns Promise<Product | null> - Product object or null if not found
 */
export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const productsRef = collection(db, 'products')
    const querySnapshot = await getDocs(productsRef)

    let product: Product | null = null
    querySnapshot.forEach((doc) => {
      if (doc.id === id) {
        const data = doc.data()
        product = {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          price: data.price || 0,
          imageUrl: data.imageUrl || data.image || '/images/placeholder-product.jpg',
        }
      }
    })

    return product
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}
