import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { verifyFirebaseIdToken } from '@/lib/firebase/verifyIdToken'
import { toPublicOrderView } from '@/lib/orderPublicView'
import type { Order } from '@/types/order'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const userId = await verifyFirebaseIdToken(bearerToken)

  if (!userId) {
    return NextResponse.json({ error: 'Sign in to see your orders' }, { status: 401 })
  }

  try {
    const db = getAdminDb()
    const snap = await db
      .collection('orders')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    const orders = snap.docs.map((doc) => toPublicOrderView(doc.data() as Order))
    return NextResponse.json({ orders })
  } catch (error) {
    console.error('[orders/mine] failed to list orders:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
