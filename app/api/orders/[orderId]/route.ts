import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import type { Order, PublicOrderView } from '@/types/order'

export const runtime = 'nodejs'

const ORDER_ID_PATTERN = /^SBH-\d{4,}$/

function toPublicView(order: Order): PublicOrderView {
  // Deliberately narrow: never the full phone number, internal notes
  // aside from the customer's own, or anything else beyond what the
  // status page needs to render.
  return {
    orderId: order.orderId,
    status: order.status,
    fulfilment: order.fulfilment,
    collectDate: order.collectDate,
    collectTime: order.collectTime,
    items: order.items,
    estimatedTotal: order.estimatedTotal,
    confirmedTotal: order.confirmedTotal,
    cancelReason: order.cancelReason,
    createdAt: order.createdAt,
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const last4 = request.nextUrl.searchParams.get('last4')

  if (!ORDER_ID_PATTERN.test(orderId) || !last4 || !/^\d{4}$/.test(last4)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const db = getAdminDb()
    const snap = await db.collection('orders').doc(orderId).get()

    // Same "not found" response whether the order doesn't exist or the
    // last 4 digits don't match — never confirm an order ID is real to
    // someone guessing phone digits.
    if (!snap.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const order = snap.data() as Order
    if (order.phoneLast4 !== last4) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(toPublicView(order))
  } catch (error) {
    console.error('[orders] failed to read order:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
