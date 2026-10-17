import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { requireAdmin } from '@/lib/server/adminAuth'
import { handleRouteError } from '@/lib/server/http'
import { klToday, loadStock, stockFlags } from '@/lib/server/stockView'
import { parsePromotions } from '@/lib/promotions/validate'
import { isLive } from '@/lib/promotions/engine'

export const runtime = 'nodejs'

/** Sidebar counts: orders to act on, stock alerts, drafts, live sales. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const db = getAdminDb()
    const today = klToday()
    const [orders, drafts, promos, rows] = await Promise.all([
      db.collection('orders').where('status', 'in', ['new', 'awaiting_payment']).count().get(),
      db.collection('products').where('status', '==', 'draft').count().get(),
      db.collection('settings').doc('promotions').get(),
      loadStock(db),
    ])
    const stockAlerts = rows.filter((r) => stockFlags(r, today).some((f) => f === 'out' || f === 'low' || f === 'expiring')).length
    return NextResponse.json({
      orders: orders.data().count,
      stock: stockAlerts,
      drafts: drafts.data().count,
      promos: parsePromotions(promos.exists ? promos.data() : undefined).promos.filter((p) => isLive(p, today)).length,
    })
  } catch (error) {
    return handleRouteError('admin/badges', error)
  }
}
