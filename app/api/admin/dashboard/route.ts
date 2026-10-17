import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { requireAdmin } from '@/lib/server/adminAuth'
import { handleRouteError } from '@/lib/server/http'
import { addDays, klToday, loadStock, stockFlags } from '@/lib/server/stockView'

export const runtime = 'nodejs'

const ACTIVE = ['new', 'confirmed', 'awaiting_payment', 'paid', 'ready']

/** KL day of an ISO timestamp. */
const klDay = (iso: string) => new Date(Date.parse(iso) + 8 * 3600_000).toISOString().slice(0, 10)

/** Command center: stats, the live fulfilment queue, expiring batches, low stock. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const db = getAdminDb()
    const today = klToday()
    const since = new Date(Date.parse(`${today}T00:00:00+08:00`)).toISOString()
    const [active, touchedToday, rows] = await Promise.all([
      db.collection('orders').where('status', 'in', ACTIVE).get(),
      db.collection('orders').where('updatedAt', '>=', since).get(),
      loadStock(db),
    ])
    const queue = active.docs
      .map((d) => {
        const o = d.data()
        const items = Array.isArray(o.items) ? o.items : []
        return {
          docId: d.id,
          orderId: String(o.orderId ?? d.id),
          status: String(o.status ?? ''),
          customerName: String(o.customerName ?? ''),
          customerPhone: String(o.customerPhone ?? ''),
          collectDate: typeof o.collectDate === 'string' ? o.collectDate : null,
          collectTime: typeof o.collectTime === 'string' ? o.collectTime : null,
          fulfilment: typeof o.fulfilment === 'string' ? o.fulfilment : null,
          estimatedTotalSen: typeof o.estimatedTotalSen === 'number' ? o.estimatedTotalSen : Math.round(Number(o.estimatedTotal ?? 0) * 100),
          confirmedTotalSen: typeof o.confirmedTotalSen === 'number' ? o.confirmedTotalSen : typeof o.confirmedTotal === 'number' ? Math.round(o.confirmedTotal * 100) : null,
          priceToConfirm: o.priceToConfirm === true,
          createdAt: typeof o.createdAt === 'string' ? o.createdAt : '',
          items: items.map((i: Record<string, unknown>) => ({ qty: Number(i.qty ?? 0), name: String(i.name ?? 'Item'), size: typeof i.sellUnitLabel === 'string' ? i.sellUnitLabel : null })),
        }
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    // Revenue confirmed today: orders whose "confirmed" step happened today.
    let revenueSen = 0
    let revenueOrders = 0
    for (const d of touchedToday.docs) {
      const o = d.data()
      if (o.status === 'cancelled') continue
      const confirmedToday = (Array.isArray(o.statusHistory) ? o.statusHistory : []).some(
        (h: { status?: string; at?: string }) => h?.status === 'confirmed' && typeof h.at === 'string' && klDay(h.at) === today,
      )
      const total = typeof o.confirmedTotalSen === 'number' ? o.confirmedTotalSen : typeof o.confirmedTotal === 'number' ? Math.round(o.confirmedTotal * 100) : null
      if (confirmedToday && total !== null) {
        revenueSen += total
        revenueOrders++
      }
    }

    const soon = addDays(today, 14)
    const expiring = rows
      .flatMap((r) => r.batches.filter((b) => b.expiryDate && b.expiryDate <= soon).map((b) => ({ productId: r.id, name: r.name, unit: r.unit, chilled: r.chilled, totalMilli: r.onHandMilli, batchId: b.id, qtyMilli: b.qtyMilli, expiryDate: b.expiryDate!, supplierName: b.supplierName })))
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
    const lowRows = rows.filter((r) => stockFlags(r, today).some((f) => f === 'out' || f === 'low'))
    const low = lowRows.map((r) => ({ productId: r.id, name: r.name, unit: r.unit, availableMilli: r.availableMilli, lowAtMilli: r.lowAtMilli, out: r.availableMilli <= 0 }))

    return NextResponse.json({
      today,
      stats: {
        actionNeeded: queue.filter((o) => o.status === 'new' || o.status === 'paid').length,
        revenueSen,
        revenueOrders,
        expiringBatches: expiring.length,
        lowOrOut: low.length,
      },
      queue,
      expiring,
      low,
      products: rows.map((r) => ({ id: r.id, name: r.name, code: r.code, unit: r.unit, category: r.category })),
    })
  } catch (error) {
    return handleRouteError('admin/dashboard', error)
  }
}
