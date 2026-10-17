import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { requireAdmin } from '@/lib/server/adminAuth'
import { writeAudit } from '@/lib/server/audit'
import { Refused, handleRouteError, readJson } from '@/lib/server/http'
import { readBatch, recountOp, wastageOp, writeInvOp, STOREROOM } from '@/lib/server/invStock'
import { klToday } from '@/lib/server/stockView'

export const runtime = 'nodejs'

const REASONS = ['damaged', 'spilled', 'expired', 'other'] as const

/** ± Adjust: take damaged/spilled stock off one batch, or set a recount. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const b = await readJson(request)
    const db = getAdminDb()
    if (b.mode === 'wastage') {
      const batchId = typeof b.batchId === 'string' ? b.batchId : ''
      const qtyMilli = b.qtyMilli
      const reason = (REASONS as readonly string[]).includes(b.reason as string) ? (b.reason as string) : 'other'
      if (!batchId) throw new Refused('Choose the batch.', 400)
      if (typeof qtyMilli !== 'number' || !Number.isInteger(qtyMilli) || qtyMilli <= 0) throw new Refused('Enter how much to take off (more than 0).', 400)
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(db.collection('batches').doc(batchId))
        if (!snap.exists) throw new Refused('That batch no longer exists.', 404)
        const batch = readBatch(snap.id, snap.data()!)
        if (qtyMilli > batch.qtyMilli) throw new Refused('That is more than this batch has left.', 400)
        writeInvOp(db, tx, wastageOp(batch, qtyMilli, reason), auth.caller)
        writeAudit(tx, auth.caller, { action: 'stock.wastage', entityType: 'product', entityId: batch.productId, before: { batchId, qtyMilli: batch.qtyMilli }, after: { qtyMilli: batch.qtyMilli - qtyMilli, reason } })
      })
      return NextResponse.json({ ok: true })
    }
    if (b.mode === 'recount') {
      const productId = typeof b.productId === 'string' ? b.productId : ''
      const countedMilli = b.countedMilli
      if (!productId) throw new Refused('Choose a product.', 400)
      if (typeof countedMilli !== 'number' || !Number.isInteger(countedMilli) || countedMilli < 0) throw new Refused('Enter the count (0 or more).', 400)
      const locationId = STOREROOM
      await db.runTransaction(async (tx) => {
        const [lv, bs] = await Promise.all([
          tx.get(db.collection('stockLevels').doc(`${productId}_${locationId}`)),
          tx.get(db.collection('batches').where('productId', '==', productId)),
        ])
        const expectedMilli = Number(lv.get('onHandMilli') ?? 0)
        const batches = bs.docs.map((d) => readBatch(d.id, d.data())).filter((x) => x.qtyMilli > 0)
        writeInvOp(db, tx, recountOp({ productId, locationId, expectedMilli, countedMilli, batches, today: klToday(), reason: 'recount' }), auth.caller)
        writeAudit(tx, auth.caller, { action: 'stock.recount', entityType: 'product', entityId: productId, before: { onHandMilli: expectedMilli }, after: { onHandMilli: countedMilli } })
      })
      return NextResponse.json({ ok: true })
    }
    throw new Refused('Unknown adjustment.', 400)
  } catch (error) {
    return handleRouteError('admin/inventory/adjust', error, 'Could not save. Check your connection and try again.')
  }
}
