import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { resolveLines, neededPerProduct, LineError } from '@/lib/server/lines'
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

    const db = getAdminDb()
    const counterRef = db.collection('counters').doc('orders')
    const nowIso = new Date().toISOString()
    const productIds = [...new Set(data.items.map((i) => i.productId))]

    const { orderId, estimatedTotal } = await db.runTransaction(async (transaction) => {
      // Firestore transactions require all reads before any writes.
      const [counterSnap, ...productSnaps] = await transaction.getAll(
        counterRef,
        ...productIds.map((id) => db.collection('products').doc(id))
      )
      // The only prices an order is ever written with: read here from the
      // product docs, by sell unit — never from the client's request.
      const lines = resolveLines(data.items, new Map(productIds.map((id, i) => [id, productSnaps[i]])), null, 'online')

      // Stock is checked only for products Sim has switched to managed; it is
      // not held until she confirms the order. Every other product is
      // ordered exactly as before.
      const need = neededPerProduct(lines.filter((l) => l.managed))
      if (need.size > 0) {
        const invSnaps = await transaction.getAll(...[...need.keys()].map((id) => db.collection('inventory').doc(id)))
        for (const [i, id] of [...need.keys()].entries()) {
          const inv = invSnaps[i].data() ?? {}
          const available = (Number(inv.onHandMilli) || 0) - (Number(inv.reservedMilli) || 0)
          const name = lines.find((l) => l.productId === id)!.name
          if (available <= 0) throw new LineError(`Sorry, ${name} is out of stock. Remove it from your cart to continue.`, 409, id)
          if (need.get(id)! > available) {
            throw new LineError(`We don't have enough ${name} for that quantity. Try fewer, or ask us on WhatsApp.`, 409, id)
          }
        }
      }

      const items: OrderItem[] = lines.map((l) => ({
        productId: l.productId,
        name: l.name,
        qty: l.qty,
        unitPriceSnapshot: l.unitPriceSen === null ? null : l.unitPriceSen / 100,
        sellUnitId: l.unit.id,
        sellUnitLabel: l.unit.label,
        factorMilli: l.unit.factorMilli,
        baseQtyMilli: l.baseQtyMilli,
        unitPriceSen: l.unitPriceSen,
      }))
      // Lines priced "on request" are kept in the order but left out of the total.
      const totalSen = lines.reduce((sum, l) => sum + (l.lineTotalSen ?? 0), 0)

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
        estimatedTotal: totalSen / 100,
        estimatedTotalSen: totalSen,
        confirmedTotal: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        statusHistory: [{ status: 'new', at: nowIso }],
      }

      transaction.set(counterRef, { seq: next }, { merge: true })
      transaction.set(db.collection('orders').doc(id), order)
      return { orderId: id, estimatedTotal: totalSen / 100 }
    })

    return NextResponse.json({ orderId, estimatedTotal }, { status: 201 })
  } catch (error) {
    if (error instanceof LineError) {
      return NextResponse.json({ error: error.message, productId: error.productId }, { status: error.status })
    }
    console.error('[orders] failed to create order:', error)
    return NextResponse.json({ error: 'Something went wrong, please try again' }, { status: 500 })
  }
}
