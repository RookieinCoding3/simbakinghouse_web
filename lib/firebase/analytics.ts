'use client'

import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from './config'

interface ProductViewLog {
  productId: string
  productName: string
  category: string
  timestamp: any
  sessionId: string
  referrer: string
  userAgent: string
}

interface ProductViewStats {
  productId: string
  productName: string
  category: string
  viewCount: number
  lastViewed: Date
}

// Generate a simple session ID for tracking
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server'

  let sessionId = sessionStorage.getItem('sbh_session_id')
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    sessionStorage.setItem('sbh_session_id', sessionId)
  }
  return sessionId
}

/**
 * Log a product view to Firestore for analytics
 * Called when a user opens a product modal
 */
export async function logProductView(
  productId: string,
  productName: string,
  category: string
): Promise<void> {
  try {
    const viewLog: ProductViewLog = {
      productId,
      productName,
      category,
      timestamp: serverTimestamp(),
      sessionId: getSessionId(),
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    }

    await addDoc(collection(db, 'productViews'), viewLog)
  } catch (error) {
    // Silently fail - analytics should never break the user experience
    console.warn('Analytics log failed:', error)
  }
}

/**
 * Log a search query for understanding customer intent
 */
export async function logSearchQuery(query: string): Promise<void> {
  if (!query.trim() || query.length < 2) return

  try {
    await addDoc(collection(db, 'searchLogs'), {
      query: query.toLowerCase().trim(),
      timestamp: serverTimestamp(),
      sessionId: getSessionId(),
    })
  } catch (error) {
    console.warn('Search log failed:', error)
  }
}

/**
 * Log category filter usage
 */
export async function logCategoryFilter(category: string): Promise<void> {
  try {
    await addDoc(collection(db, 'categoryLogs'), {
      category,
      timestamp: serverTimestamp(),
      sessionId: getSessionId(),
    })
  } catch (error) {
    console.warn('Category log failed:', error)
  }
}

/**
 * Log order button clicks (conversion tracking)
 */
export async function logOrderIntent(
  productId: string,
  productName: string,
  price: number
): Promise<void> {
  try {
    await addDoc(collection(db, 'orderIntents'), {
      productId,
      productName,
      price,
      timestamp: serverTimestamp(),
      sessionId: getSessionId(),
    })
  } catch (error) {
    console.warn('Order intent log failed:', error)
  }
}

/**
 * Fetch top viewed products for business insights
 * Use this in an admin dashboard or for featured product decisions
 */
export async function getTopViewedProducts(days: number = 7): Promise<ProductViewStats[]> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const viewsRef = collection(db, 'productViews')
    const q = query(
      viewsRef,
      where('timestamp', '>=', startDate),
      orderBy('timestamp', 'desc'),
      limit(500)
    )

    const snapshot = await getDocs(q)

    // Aggregate views by product
    const viewCounts = new Map<string, ProductViewStats>()

    snapshot.forEach((doc) => {
      const data = doc.data()
      const existing = viewCounts.get(data.productId)

      if (existing) {
        existing.viewCount++
        if (data.timestamp?.toDate() > existing.lastViewed) {
          existing.lastViewed = data.timestamp.toDate()
        }
      } else {
        viewCounts.set(data.productId, {
          productId: data.productId,
          productName: data.productName,
          category: data.category,
          viewCount: 1,
          lastViewed: data.timestamp?.toDate() || new Date(),
        })
      }
    })

    // Sort by view count descending
    return Array.from(viewCounts.values())
      .sort((a, b) => b.viewCount - a.viewCount)
  } catch (error) {
    console.warn('Failed to fetch top viewed products:', error)
    return []
  }
}
