import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'
import { requireAdmin } from '@/lib/server/adminAuth'
import { writeAudit } from '@/lib/server/audit'
import { StockSession, opAlreadyDone, claimOp, SHOP_ID } from '@/lib/server/stock'
import { count } from '@/lib/inventory/engine'
import { readJson, handleRouteError, isOpId, isMilli } from '@/lib/server/http'

export const runtime = 'nodejs'

/**
 * Applies a shelf count (stock count mode). Each entry is what Sim actually
 * counted. Managed products: a "count" movement sets on-hand to that number
 * (the difference is the correction) and stamps "last counted". Unmanaged
 * products: nothing about selling changes — the number is kept as an
 * opening-count draft, which switching the product to managed requires.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  const b = await readJson(request)
  const counts = Array.isArray(b.counts) ? b.counts : []
  const valid = counts.every(
    (c) => c && typeof c === 'object' && typeof (c as { productId?: unknown }).productId === 'string' && isMilli((c as { countedMilli?: unknown }).countedMilli, { allowZero: true })
  )
  if (!isOpId(b.opId) || counts.length === 0 || counts.length > 300 || !valid) {
    return NextResponse.json({ error: 'Invalid count.' }, { status: 400 })
  }
  const entries = counts as { productId: string; countedMilli: number }[]
  const opId = b.opId
  const db = getAdminDb()

  try {
    const result = await db.runTransaction(async (tx) => {
      if (await opAlreadyDone(tx, opId)) return { duplicate: true, applied: 0, drafts: 0 }
      const session = new StockSession(tx, auth.caller)
      await session.load(entries.map((e) => e.productId))
      let applied = 0
      let drafts = 0
      const changes: Record<string, { before: number; after: number }> = {}
      for (const e of entries) {
        const it = session.item(e.productId)
        if (!it.product) continue
        if (it.config.managed) {
          const before = it.state.onHandMilli
          const m = session.apply(e.productId, (s) => count(s, e.countedMilli, { batch: { id: session.newBatchId(), expiryDate: null, receivedAt: Date.now() } }), { opId, note: 'stock count' })
          // A count with no difference still records that the shelf was checked.
          if (!m) it.touched = true
          changes[e.productId] = { before, after: e.countedMilli }
          applied++
        } else {
          tx.set(db.collection('stockCountDrafts').doc(e.productId), {
            shopId: SHOP_ID,
            productId: e.productId,
            countedMilli: e.countedMilli,
            countedAt: FieldValue.serverTimestamp(),
            byUid: auth.caller.uid,
          })
          drafts++
        }
      }
      claimOp(tx, opId, auth.caller, 'count')
      session.commit({ lastCountedAt: true })
      writeAudit(tx, auth.caller, { action: 'stock.countSession', entityType: 'stock', entityId: opId, before: null, after: { applied, drafts, changes } })
      return { duplicate: false, applied, drafts }
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return handleRouteError('admin/stock/count', error)
  }
}
