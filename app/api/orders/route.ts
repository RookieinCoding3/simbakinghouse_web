import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { resolveOrderItemPrices } from '@/lib/firebase/adminProducts'
import { validateOrderInput } from '@/lib/orderValidation'
import { fetchShopSettings } from '@/lib/firebase/settings'
import { lastFourDigits } from '@/lib/phone'
import { verifyFirebaseIdToken } from '@/lib/firebase/verifyIdToken'
import { isHoneypotTripped, isSubmittedTooFast } from '@/lib/botDefense'
import { verifyCheckoutToken } from '@/lib/checkoutToken'
import { getClientIp, hashIp } from '@/lib/clientIp'
import { checkAndRecordOrderAttempt, RateLimitExceeded, formatRetryAfter } from '@/lib/orderRateLimit'
import type { Order, OrderItem } from '@/types/order'

// Orders are written here via the Admin SDK, not from the client through
// Firestore rules — same pattern as app/api/analytics/route.ts. That keeps
// Firestore's client-facing rules closed for /orders entirely: nothing
// needs opening there for checkout to work.
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>

    // Checked before anything else touches Firestore: cheapest possible
    // rejection for the most obvious bot traffic.
    if (isHoneypotTripped(b.company)) {
      return NextResponse.json({ error: 'Something went wrong, please try again' }, { status: 400 })
    }

    if (!verifyCheckoutToken(b.formToken, b.formIssuedAt)) {
      return NextResponse.json(
        { error: 'Your checkout session expired — please reload the page and try again' },
        { status: 400 }
      )
    }
    if (isSubmittedTooFast(b.formIssuedAt as number, Date.now())) {
      return NextResponse.json(
        { error: 'Please take a moment to review your order before sending' },
        { status: 400 }
      )
    }

    const { shopOpensAt, shopClosesAt } = await fetchShopSettings()
    const validated = validateOrderInput(body, { shopOpensAt, shopClosesAt })
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }
    const { data } = validated

    // Optional: stamp the order with the signed-in user's uid so it shows
    // up in their order history (app/api/orders/mine). Guest checkout
    // (no/invalid token) is untouched — this never blocks order creation.
    const authHeader = request.headers.get('Authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    const userId = await verifyFirebaseIdToken(bearerToken)

    const ipHash = hashIp(getClientIp(request))
    try {
      await checkAndRecordOrderAttempt({ phone: data.customerPhone, ipHash })
    } catch (error) {
      if (error instanceof RateLimitExceeded) {
        return NextResponse.json(
          { error: `Too many orders — please try again in ${formatRetryAfter(error.retryAfterMs)}` },
          { status: 429 }
        )
      }
      throw error
    }

    // The only prices an order is ever written with: looked up fresh from
    // Firestore here, never read from the client's own request body.
    const resolvedPrices = await resolveOrderItemPrices(data.items.map((item) => item.productId))
    const items: OrderItem[] = []
    for (const item of data.items) {
      const product = resolvedPrices.get(item.productId)
      if (!product) {
        return NextResponse.json(
          { error: 'One of the items in your cart is no longer available — please refresh and try again' },
          { status: 400 }
        )
      }
      items.push({ productId: item.productId, name: product.name, qty: item.qty, unitPriceSnapshot: product.price })
    }
    const estimatedTotal = items.reduce((sum, item) => sum + (item.unitPriceSnapshot ?? 0) * item.qty, 0)

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
        userId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        phoneLast4: lastFourDigits(data.customerPhone),
        fulfilment: data.fulfilment,
        collectDate: data.collectDate,
        collectTime: data.collectTime,
        notes: data.notes,
        items,
        estimatedTotal,
        confirmedTotal: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        statusHistory: [{ status: 'new', at: nowIso }],
      }

      transaction.set(counterRef, { seq: next }, { merge: true })
      transaction.set(db.collection('orders').doc(id), order)
      return id
    })

    return NextResponse.json({ orderId, estimatedTotal }, { status: 201 })
  } catch (error) {
    console.error('[orders] failed to create order:', error)
    return NextResponse.json({ error: 'Something went wrong, please try again' }, { status: 500 })
  }
}
