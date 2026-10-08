import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { requireAdmin } from '@/lib/server/adminAuth'
import { writeAudit } from '@/lib/server/audit'
import { StockSession } from '@/lib/server/stock'
import { reserve, release, deduct } from '@/lib/inventory/engine'
import { MILLI, formatQty } from '@/lib/inventory/units'
import { KNOWN_STATUSES } from '@/lib/admin/normalizeOrder'
import type { OrderStatus, OrderStock } from '@/types/order'

export const runtime = 'nodejs'

const NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['paid', 'cancelled'],
  paid: ['ready', 'cancelled'],
  ready: ['collected', 'cancelled'],
}

class Refused extends Error {
  status: number
  data: Record<string, unknown>
  constructor(message: string, status = 409, data: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.data = data
  }
}

interface Line {
  productId: string
  name: string
  qty: number
  baseQtyMilli: number
}

function linesOf(order: Record<string, unknown>): Line[] {
  if (!Array.isArray(order.items)) return []
  return order.items
    .filter((i): i is Record<string, unknown> => !!i && typeof i === 'object' && typeof (i as { productId?: unknown }).productId === 'string')
    .map((i) => {
      const qty = Math.max(0, Math.round(Number(i.qty) || 0))
      const base = typeof i.baseQtyMilli === 'number' && Number.isInteger(i.baseQtyMilli) ? i.baseQtyMilli : qty * MILLI
      return { productId: i.productId as string, name: typeof i.name === 'string' ? i.name : 'Item', qty, baseQtyMilli: base }
    })
    .filter((l) => l.baseQtyMilli > 0)
}

function sumByProduct(lines: { productId: string; baseQtyMilli: number }[]) {
  const m = new Map<string, number>()
  for (const l of lines) m.set(l.productId, (m.get(l.productId) ?? 0) + l.baseQtyMilli)
  return m
}

/**
 * Moves an order to its next status — and, for products whose stock is
 * managed here, holds stock on confirm, deducts it on collect and releases
 * it on cancel, all in one transaction with the status change. Repeating a
 * step (double tap, two phones) is a no-op: the order's own status and
 * `stock.state` say what has already happened.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  const { orderId } = await params
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const to = body?.to as OrderStatus
  if (!KNOWN_STATUSES.includes(to)) return NextResponse.json({ error: 'Unknown status.' }, { status: 400 })
  const confirmedTotalSen = typeof body?.confirmedTotalSen === 'number' && Number.isInteger(body.confirmedTotalSen) && body.confirmedTotalSen >= 0 ? body.confirmedTotalSen : null
  const cancelReason = typeof body?.cancelReason === 'string' ? body.cancelReason.trim().slice(0, 300) : ''
  if (to === 'confirmed' && confirmedTotalSen === null) return NextResponse.json({ error: 'Enter a valid total.' }, { status: 400 })
  if (to === 'cancelled' && !cancelReason) return NextResponse.json({ error: 'Enter a reason.' }, { status: 400 })

  const db = getAdminDb()
  const ref = db.collection('orders').doc(orderId)
  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) throw new Refused('Order not found.', 404)
      const order = snap.data() as Record<string, unknown>
      const current = (typeof order.status === 'string' ? order.status.toLowerCase() : '') as OrderStatus
      if (current === to) return { unchanged: true }
      if (!NEXT[current]?.includes(to)) {
        throw new Refused(`This order is ${current || 'in an unknown state'}; it can't be marked ${to}.`)
      }

      const lines = linesOf(order)
      const stock = (order.stock ?? null) as OrderStock | null
      const session = new StockSession(tx, auth.caller)
      await session.load([...new Set(lines.map((l) => l.productId))])

      let newStock: OrderStock | null = stock
      const legacyStockCounts: { ref: FirebaseFirestore.DocumentReference; value: number }[] = []

      if (to === 'confirmed') {
        const need = sumByProduct(lines.filter((l) => session.item(l.productId).config.managed))
        const short = [...need.entries()]
          .filter(([id, n]) => n > session.available(id))
          .map(([id, n]) => {
            const it = session.item(id)
            return {
              productId: id,
              name: lines.find((l) => l.productId === id)!.name,
              needed: formatQty(n, it.config.baseUnit),
              available: formatQty(Math.max(0, session.available(id)), it.config.baseUnit),
            }
          })
        if (short.length) {
          throw new Refused(
            `Not enough stock to confirm: ${short.map((s) => `${s.name} (need ${s.needed}, only ${s.available} available)`).join('; ')}.`,
            409,
            { short }
          )
        }
        for (const [id, n] of need) session.apply(id, (s) => reserve(s, n), { orderId })
        newStock = need.size ? { state: 'reserved', lines: [...need].map(([productId, qtyMilli]) => ({ productId, qtyMilli })) } : null
      }

      if (to === 'collected') {
        const held = new Map((stock?.state === 'reserved' ? stock.lines : []).map((l) => [l.productId, l.qtyMilli]))
        const deducted: OrderStock['lines'] = []
        for (const [id, n] of sumByProduct(lines)) {
          const it = session.item(id)
          const reservedQty = held.get(id) ?? 0
          if (it.config.managed) {
            session.apply(id, (s) => deduct(s, n, 'sale', reservedQty), { orderId })
            if (reservedQty > n) session.apply(id, (s) => release(s, reservedQty - n), { orderId })
            deducted.push({ productId: id, qtyMilli: n })
          } else if (reservedQty > 0 && it.invExists) {
            // Held while managed, product switched off since: just let go of the hold.
            session.apply(id, (s) => release(s, reservedQty), { orderId, note: 'product no longer managed' })
          } else if (typeof it.product?.stockCount === 'number') {
            // Unchanged legacy behaviour for unmanaged products.
            legacyStockCounts.push({ ref: it.productRef, value: Math.max(0, it.product.stockCount - Math.round(n / MILLI)) })
          }
        }
        newStock = deducted.length ? { state: 'deducted', lines: deducted } : stock ? { ...stock, state: 'released' } : null
      }

      if (to === 'cancelled' && stock?.state === 'reserved') {
        for (const l of stock.lines) {
          if (session.item(l.productId).invExists) session.apply(l.productId, (s) => release(s, l.qtyMilli), { orderId })
        }
        newStock = { ...stock, state: 'released' }
      }

      const nowIso = new Date().toISOString()
      const history = Array.isArray(order.statusHistory) ? order.statusHistory : []
      tx.update(ref, {
        status: to,
        updatedAt: nowIso,
        statusHistory: [...history, { status: to, at: nowIso }],
        ...(to === 'confirmed' && { confirmedTotal: confirmedTotalSen! / 100, confirmedTotalSen }),
        ...(to === 'cancelled' && { cancelReason }),
        ...(newStock ? { stock: newStock } : {}),
      })
      session.commit()
      for (const s of legacyStockCounts) tx.update(s.ref, { stockCount: s.value })
      writeAudit(tx, auth.caller, {
        action: 'order.status',
        entityType: 'order',
        entityId: orderId,
        before: { status: current },
        after: { status: to, ...(newStock && { stock: newStock.state }) },
      })
      return { unchanged: false }
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    if (error instanceof Refused) return NextResponse.json({ error: error.message, ...error.data }, { status: error.status })
    console.error('[admin/orders/transition] failed:', error)
    return NextResponse.json({ error: 'Could not update the order. Try again.' }, { status: 500 })
  }
}
