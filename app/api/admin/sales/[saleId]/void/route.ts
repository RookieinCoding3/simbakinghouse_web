import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'
import { requireAdmin } from '@/lib/server/adminAuth'
import { writeAudit } from '@/lib/server/audit'
import { StockSession } from '@/lib/server/stock'
import { add, type Allocation } from '@/lib/inventory/engine'
import { klDateKey } from '@/lib/time'
import { Refused, readJson, handleRouteError } from '@/lib/server/http'

export const runtime = 'nodejs'

/**
 * Voids a walk-in sale from today (Malaysian time), with a reason. The sale
 * is never deleted — it's marked voided — and the stock it took goes back
 * into the exact batches it came from. Voiding twice changes nothing.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ saleId: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  const { saleId } = await params
  const b = await readJson(request)
  const reason = typeof b.reason === 'string' ? b.reason.trim().slice(0, 300) : ''
  if (!reason) return NextResponse.json({ error: 'Enter a reason.' }, { status: 400 })
  const db = getAdminDb()
  const ref = db.collection('sales').doc(saleId)

  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) throw new Refused('Sale not found.', 404)
      const sale = snap.data()!
      if (sale.status === 'voided') return { unchanged: true }
      if (sale.dayKey !== klDateKey()) throw new Refused("Only today's sales can be voided.")
      const stock = (Array.isArray(sale.stock) ? sale.stock : []) as { productId: string; qtyMilli: number; allocations: Allocation[] }[]
      const session = new StockSession(tx, auth.caller)
      await session.load(stock.map((s) => s.productId))
      for (const s of stock) {
        if (s.qtyMilli > 0 && session.item(s.productId).invExists) {
          session.apply(s.productId, (st) => add(st, s.qtyMilli, 'void', { restore: s.allocations }), { saleId, note: `void: ${reason}` })
        }
      }
      tx.update(ref, { status: 'voided', voidReason: reason, voidedBy: auth.caller.uid, voidedAt: FieldValue.serverTimestamp() })
      session.commit()
      writeAudit(tx, auth.caller, { action: 'sale.void', entityType: 'sale', entityId: saleId, before: { status: sale.status }, after: { status: 'voided' }, note: reason })
      return { unchanged: false }
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return handleRouteError('admin/sales/void', error)
  }
}
