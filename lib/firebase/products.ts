import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from './config'
import type { Product } from '@/types/product'

/**
 * Fetch products from the Firestore 'products' collection
 * @param limitCount - Optional limit on number of products to fetch
 * @returns Promise<Product[]> - Array of product objects
 */
export async function fetchProducts(limitCount?: number): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'products')

    // Build query with orderBy fallback
    let q
    try {
      q = limitCount
        ? query(productsRef, orderBy('name', 'asc'), limit(limitCount))
        : query(productsRef, orderBy('name', 'asc'))
    } catch (orderError) {
      // Fallback to query without orderBy if index doesn't exist
      q = limitCount
        ? query(productsRef, limit(limitCount))
        : productsRef
    }

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return []
    }

    const products: Product[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()

      // Flexible field mapping to handle different database structures
      const product: Product = {
        id: doc.id,
        name: data.name || data.title || data.productName || data.Name || 'Untitled Product',
        description: data.description || data.desc || data.Description || data.details || '',
        price: data.price || data.Price || data.cost || 0,
        imageUrl: data.imageUrl || data.image || data.imageURL || data.photo || data.photoURL || '/images/placeholder-product.jpg',
        category: data.category || data.Category || 'Uncategorized',
        featured: data.featured ?? false,
        inStock: data.inStock ?? true,
        stockQuantity: data.stockQuantity ?? 0,
        createdAt: data.createdAt?.toDate?.(),
        updatedAt: data.updatedAt?.toDate?.(),
      }

      products.push(product)
    })

    return products

  } catch (error: any) {
    throw new Error(`Failed to fetch products from Firestore: ${error.message}`)
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
          name: data.name || data.title || data.productName || 'Untitled Product',
          description: data.description || data.desc || data.Description || '',
          price: data.price || data.Price || 0,
          imageUrl: data.imageUrl || data.image || data.imageURL || data.photo || '/images/placeholder-product.jpg',
          category: data.category || data.Category || 'Uncategorized',
          featured: data.featured ?? false,
          inStock: data.inStock ?? true,
          stockQuantity: data.stockQuantity ?? 0,
          createdAt: data.createdAt?.toDate?.(),
          updatedAt: data.updatedAt?.toDate?.(),
        }
      }
    })

    return product
  } catch (error: any) {
    return null
  }
}

/**
 * Fetch multiple products by their IDs in a specific order
 * @param ids - Array of product document IDs in desired order
 * @returns Promise<Product[]> - Array of product objects in the specified order
 */
export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'products')
    const querySnapshot = await getDocs(productsRef)

    // Create a map for quick lookup
    const productMap = new Map<string, Product>()

    querySnapshot.forEach((doc) => {
      if (ids.includes(doc.id)) {
        const data = doc.data()
        const product: Product = {
          id: doc.id,
          name: data.name || data.title || data.productName || 'Untitled Product',
          description: data.description || data.desc || data.Description || '',
          price: data.price || data.Price || 0,
          imageUrl: data.imageUrl || data.image || data.imageURL || data.photo || '/images/placeholder-product.jpg',
          category: data.category || data.Category || 'Uncategorized',
          featured: data.featured ?? false,
          inStock: data.inStock ?? true,
          stockQuantity: data.stockQuantity ?? 0,
          createdAt: data.createdAt?.toDate?.(),
          updatedAt: data.updatedAt?.toDate?.(),
        }
        productMap.set(doc.id, product)
      }
    })

    // Return products in the order specified by ids array
    const products = ids
      .map(id => productMap.get(id))
      .filter((product): product is Product => product !== undefined)

    return products
  } catch (error: any) {
    return []
  }
}
