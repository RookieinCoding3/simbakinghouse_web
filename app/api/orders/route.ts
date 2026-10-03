import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { validateOrderInput } from '@/lib/orderValidation'
import { fetchShopSettings } from '@/lib/firebase/settings'
import { lastFourDigits } from '@/lib/phone'
import type { Order } from '@/types/order'

// Orders are written here via the Admin SDK, not from the client through
// Firestore rules — same pattern as app/api/analytics/route.ts. That keeps
// Firestore's client-facing rules closed for /orders entirely: nothing
// needs opening there for checkout to work.
export const runtime = 'nodejs'

// Best-effort, in-memory, resets on cold start — stops a runaway retry
// loop or a mashed button, not a determined attacker. See the analytics
// route for the same trade-off with a fuller explanation.
const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_ORDERS_PER_PHONE = 5
const MAX_ORDERS_GLOBAL = 60
const phoneHits = new Map<string, { count: number; windowStart: number }>()
let globalHits = { count: 0, windowStart: Date.now() }

function isRateLimited(phone: string): boolean {
  const now = Date.now()
  if (now - globalHits.windowStart > RATE_LIMIT_WINDOW_MS) {
    globalHits = { count: 0, windowStart: now }
  }
  globalHits.count++
  if (globalHits.count > MAX_ORDERS_GLOBAL) return true

  const entry = phoneHits.get(phone)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    phoneHits.set(phone, { count: 1, windowStart: now })
    return false
  }
  entry.count++
  return entry.count > MAX_ORDERS_PER_PHONE
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const { shopOpensAt, shopClosesAt } = await fetchShopSettings()
    const validated = validateOrderInput(body, { shopOpensAt, shopClosesAt })
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }
    const { data } = validated

    if (isRateLimited(data.customerPhone)) {
      return NextResponse.json({ error: 'Too many orders, please try again shortly' }, { status: 429 })
    }

    const db = getAdminDb()
    const counterRef = db.collection('counters').doc('orders')
    const nowIso = new Date().toISOString()

    const orderId = await db.runTransaction(async (transaction) => {
      // Firestore transactions require all reads before any writes.
      const counterSnap = await transaction.get(counterRef)
      const next = (counterSnap.exists ? (counterSnap.data()?.seq ?? 0) : 0) + 1
      const id = `SBH-${String(next).padStart(4, '0')}`

      const order: Order = {
        orderId: id,
        status: 'new',
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        phoneLast4: lastFourDigits(data.customerPhone),
        fulfilment: data.fulfilment,
        collectDate: data.collectDate,
        collectTime: data.collectTime,
        notes: data.notes,
        items: data.items,
        estimatedTotal: data.estimatedTotal,
        confirmedTotal: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        statusHistory: [{ status: 'new', at: nowIso }],
      }

      transaction.set(counterRef, { seq: next }, { merge: true })
      transaction.set(db.collection('orders').doc(id), order)
      return id
    })

    return NextResponse.json({ orderId, estimatedTotal: data.estimatedTotal }, { status: 201 })
  } catch (error) {
    console.error('[orders] failed to create order:', error)
    return NextResponse.json({ error: 'Something went wrong, please try again' }, { status: 500 })
  }
}
