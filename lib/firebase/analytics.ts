// Client-side analytics helpers. These never touch Firestore directly —
// they POST to /api/analytics, which validates, rate-limits, and writes
// server-side via the Admin SDK. Firestore's client-facing rules stay
// fully closed for these collections; no public write access is opened.
//
// Every function here fails silently: analytics must never break the page.

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server'

  let sessionId = sessionStorage.getItem('sbh_session_id')
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    sessionStorage.setItem('sbh_session_id', sessionId)
  }
  return sessionId
}

async function sendEvent(payload: Record<string, unknown>): Promise<void> {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: getSessionId(), ...payload }),
      keepalive: true,
    })
  } catch {
    // Network error, offline, ad blocker, whatever — never surface this.
  }
}

/**
 * Log a product view. Called when a user opens a product modal.
 */
export async function logProductView(
  productId: string,
  productName: string,
  category: string
): Promise<void> {
  await sendEvent({ type: 'product_view', productId, productName, category })
}

/**
 * Log a search query for understanding customer intent.
 */
export async function logSearchQuery(query: string): Promise<void> {
  if (!query.trim() || query.length < 2) return
  await sendEvent({ type: 'search', query: query.toLowerCase().trim() })
}

/**
 * Log category filter usage.
 */
export async function logCategoryFilter(category: string): Promise<void> {
  await sendEvent({ type: 'category_filter', category })
}

/**
 * Log order button clicks (conversion tracking).
 */
export async function logOrderIntent(
  productId: string,
  productName: string,
  price: number
): Promise<void> {
  await sendEvent({ type: 'order_intent', productId, productName, price })
}
