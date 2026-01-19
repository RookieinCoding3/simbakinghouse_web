import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from './config'
import type { Product } from '@/types/product'

/**
 * Fetch products from the Firestore 'products' collection
 * @param limitCount - Optional limit on number of products to fetch
 * @returns Promise<Product[]> - Array of product objects
 */
export async function fetchProducts(limitCount?: number): Promise<Product[]> {
  console.log('🔥 Firebase: Starting product fetch...')
  console.log(`📦 Fetching from collection: "products"${limitCount ? ` (limit: ${limitCount})` : ' (all)'}`)

  try {
    // Log Firebase config status
    console.log('🔧 Firebase DB instance:', db ? 'Initialized ✓' : 'NOT initialized ✗')

    const productsRef = collection(db, 'products')
    console.log('📁 Collection reference created:', productsRef.path)

    // Build query - try without orderBy first if that's causing issues
    let q
    try {
      q = limitCount
        ? query(productsRef, orderBy('name', 'asc'), limit(limitCount))
        : query(productsRef, orderBy('name', 'asc'))
      console.log('✓ Query built with orderBy')
    } catch (orderError) {
      console.warn('⚠️ OrderBy failed, trying without ordering:', orderError)
      // Fallback to query without orderBy
      q = limitCount
        ? query(productsRef, limit(limitCount))
        : productsRef
    }

    console.log('🔄 Executing Firestore query...')
    const querySnapshot = await getDocs(q)

    console.log(`✓ Query completed! Found ${querySnapshot.size} documents`)
    console.log(`📊 Empty: ${querySnapshot.empty}`)

    if (querySnapshot.empty) {
      console.warn('⚠️ No products found in Firestore collection "products"')
      console.warn('💡 Check that:')
      console.warn('   1. The collection name is "products" (lowercase)')
      console.warn('   2. You have added documents to this collection')
      console.warn('   3. Your Firestore security rules allow reads')
      return []
    }

    const products: Product[] = []
    querySnapshot.forEach((doc, index) => {
      const data = doc.data()
      console.log(`\n📄 Document ${index + 1}/${querySnapshot.size}:`, doc.id)
      console.log('   Raw data:', JSON.stringify(data, null, 2))

      // Flexible field mapping to handle different database structures
      const product: Product = {
        id: doc.id,
        // Try multiple field name variations for name/title
        name: data.name || data.title || data.productName || data.Name || 'Untitled Product',
        // Try multiple field name variations for description
        description: data.description || data.desc || data.Description || data.details || '',
        // Try multiple field name variations for price
        price: data.price || data.Price || data.cost || 0,
        // Try multiple field name variations for image
        imageUrl: data.imageUrl || data.image || data.imageURL || data.photo || data.photoURL || '/images/placeholder-product.jpg',
      }

      console.log('   ✓ Mapped to:', product)

      // Warn about missing fields
      if (!data.name && !data.title && !data.productName) {
        console.warn(`   ⚠️ Document ${doc.id}: No "name" or "title" field found!`)
      }
      if (!data.price && data.price !== 0) {
        console.warn(`   ⚠️ Document ${doc.id}: No "price" field found!`)
      }

      products.push(product)
    })

    console.log(`\n✅ Successfully fetched ${products.length} products`)
    return products

  } catch (error: any) {
    console.error('\n❌ Firestore Error:', error)
    console.error('Error details:')
    console.error('  - Code:', error.code)
    console.error('  - Message:', error.message)
    console.error('  - Name:', error.name)

    if (error.code === 'permission-denied') {
      console.error('\n🔒 PERMISSION DENIED!')
      console.error('💡 Fix: Update your Firestore security rules to allow reads:')
      console.error('   rules_version = \'2\';')
      console.error('   service cloud.firestore {')
      console.error('     match /databases/{database}/documents {')
      console.error('       match /products/{document=**} {')
      console.error('         allow read: if true;')
      console.error('       }')
      console.error('     }')
      console.error('   }')
    }

    if (error.code === 'unavailable') {
      console.error('\n🌐 FIREBASE UNAVAILABLE!')
      console.error('💡 Check your internet connection and Firebase status')
    }

    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      console.error('\n📇 MISSING INDEX!')
      console.error('💡 Firestore needs an index for orderBy queries')
      console.error('   Click the link in the error message to create it automatically')
    }

    throw new Error(`Failed to fetch products from Firestore: ${error.message}`)
  }
}

/**
 * Fetch a single product by ID
 * @param id - The product document ID
 * @returns Promise<Product | null> - Product object or null if not found
 */
export async function fetchProductById(id: string): Promise<Product | null> {
  console.log(`🔥 Firebase: Fetching product by ID: ${id}`)

  try {
    const productsRef = collection(db, 'products')
    const querySnapshot = await getDocs(productsRef)

    let product: Product | null = null
    querySnapshot.forEach((doc) => {
      if (doc.id === id) {
        const data = doc.data()
        console.log(`✓ Found product ${id}:`, data)

        product = {
          id: doc.id,
          name: data.name || data.title || data.productName || 'Untitled Product',
          description: data.description || data.desc || data.Description || '',
          price: data.price || data.Price || 0,
          imageUrl: data.imageUrl || data.image || data.imageURL || data.photo || '/images/placeholder-product.jpg',
        }
      }
    })

    if (!product) {
      console.warn(`⚠️ Product with ID ${id} not found`)
    }

    return product
  } catch (error: any) {
    console.error(`❌ Error fetching product ${id}:`, error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    return null
  }
}
