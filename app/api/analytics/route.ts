import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'

// Server-side analytics intake. The browser never talks to Firestore
// directly for this — it POSTs here, and this route (using the Admin SDK,
// which bypasses Firestore security rules by design) is the only thing
// that actually writes. That keeps the rules locked down: no client write
// access needs to be opened for analytics to work.
//
// Deliberately not storing: IP addresses, user agents, referrers, cookies,
// or anything else that could identify a visitor. sessionId is a random
// token the client generates itself (see lib/firebase/analytics.ts) purely
// to group events from the same browser tab — not personally identifying.
export const runtime = 'nodejs'

type EventType = 'search' | 'category_filter' | 'product_view' | 'order_intent'

const COLLECTION_BY_TYPE: Record<EventType, string> = {
  search: 'searchLogs',
  category_filter: 'categoryLogs',
  product_view: 'productViews',
  order_intent: 'orderIntents',
}

// Best-effort, in-memory only. State resets on cold start and isn't shared
// across concurrent serverless instances, so this stops a runaway retry
// loop or someone mashing a button, not a determined attacker rotating
// session IDs across many requests. A durable store (e.g. Upstash Redis)
// would be the next step if that ever becomes necessary.
const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_EVENTS_PER_SESSION = 20
const MAX_EVENTS_GLOBAL = 300

const sessionHits = new Map<string, { count: number; windowStart: number }>()
let globalHits = { count: 0, windowStart: Date.now() }

function isRateLimited(sessionId: string): boolean {
  const now = Date.now()

  if (now - globalHits.windowStart > RATE_LIMIT_WINDOW_MS) {
    globalHits = { count: 0, windowStart: now }
  }
  globalHits.count++
  if (globalHits.count > MAX_EVENTS_GLOBAL) return true

  const entry = sessionHits.get(sessionId)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    sessionHits.set(sessionId, { count: 1, windowStart: now })
    return false
  }
  entry.count++
  return entry.count > MAX_EVENTS_PER_SESSION
}

function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'invalid body' }, { status: 400 })
    }

    const { type, sessionId } = body as Record<string, unknown>

    if (!isNonEmptyString(sessionId, 100)) {
      return NextResponse.json({ error: 'invalid sessionId' }, { status: 400 })
    }

    if (typeof type !== 'string' || !(type in COLLECTION_BY_TYPE)) {
      return NextResponse.json({ error: 'invalid event type' }, { status: 400 })
    }

    if (isRateLimited(sessionId)) {
      return NextResponse.json({ error: 'rate limited' }, { status: 429 })
    }

    const eventType = type as EventType
    let data: Record<string, unknown> | null = null

    switch (eventType) {
      case 'search': {
        const { query } = body as Record<string, unknown>
        if (!isNonEmptyString(query, 200)) {
          return NextResponse.json({ error: 'invalid query' }, { status: 400 })
        }
        data = { query: query.trim().toLowerCase() }
        break
      }
      case 'category_filter': {
        const { category } = body as Record<string, unknown>
        if (!isNonEmptyString(category, 100)) {
          return NextResponse.json({ error: 'invalid category' }, { status: 400 })
        }
        data = { category }
        break
      }
      case 'product_view': {
        const { productId, productName, category } = body as Record<string, unknown>
        if (
          !isNonEmptyString(productId, 100) ||
          !isNonEmptyString(productName, 200) ||
          !isNonEmptyString(category, 100)
        ) {
          return NextResponse.json({ error: 'invalid product_view payload' }, { status: 400 })
        }
        data = { productId, productName, category }
        break
      }
      case 'order_intent': {
        const { productId, productName, price } = body as Record<string, unknown>
        if (
          !isNonEmptyString(productId, 100) ||
          !isNonEmptyString(productName, 200) ||
          typeof price !== 'number' ||
          !Number.isFinite(price) ||
          price < 0
        ) {
          return NextResponse.json({ error: 'invalid order_intent payload' }, { status: 400 })
        }
        data = { productId, productName, price }
        break
      }
    }

    const db = getAdminDb()
    await db.collection(COLLECTION_BY_TYPE[eventType]).add({
      ...data,
      sessionId,
      timestamp: FieldValue.serverTimestamp(),
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[analytics] failed to record event:', error)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
