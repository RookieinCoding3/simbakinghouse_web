import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { requireAdmin } from '@/lib/server/adminAuth'
import { writeAudit } from '@/lib/server/audit'
import { Refused, handleRouteError, isIsoDate, readJson } from '@/lib/server/http'
import { receiveOp, writeInvOp, STOREROOM } from '@/lib/server/invStock'
import { klToday } from '@/lib/server/stockView'

export const runtime = 'nodejs'

/** Receive Batch: qty + cost + supplier + expiry → a new batch (FEFO). */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const b = await readJson(request)
    const productId = typeof b.productId === 'string' ? b.productId : ''
    const qtyMilli = b.qtyMilli
    if (!productId) throw new Refused('Choose a product.', 400)
    if (typeof qtyMilli !== 'number' || !Number.isInteger(qtyMilli) || qtyMilli <= 0 || qtyMilli > 1e9) throw new Refused('Enter how many arrived (more than 0).', 400)
    const unitCostSen = b.unitCostSen === null || b.unitCostSen === undefined || b.unitCostSen === '' ? null : b.unitCostSen
    if (unitCostSen !== null && (typeof unitCostSen !== 'number' || !Number.isInteger(unitCostSen) || unitCostSen < 0 || unitCostSen > 1e7)) throw new Refused('Enter a valid cost.', 400)
    const expiryDate = b.expiryDate ? b.expiryDate : null
    if (expiryDate !== null && !isIsoDate(expiryDate)) throw new Refused('Enter a valid expiry date.', 400)
    const supplierName = typeof b.supplierName === 'string' && b.supplierName.trim() ? b.supplierName.trim().slice(0, 100) : null
    const note = typeof b.note === 'string' && b.note.trim() ? b.note.trim().slice(0, 300) : null
    const db = getAdminDb()
    const op = receiveOp({ productId, qtyMilli, unitCostSen: unitCostSen as number | null, supplierName, expiryDate: expiryDate as string | null, receivedDate: klToday(), locationId: STOREROOM, note })
    await db.runTransaction(async (tx) => {
      const p = await tx.get(db.collection('products').doc(productId))
      if (!p.exists) throw new Refused('That product no longer exists.', 404)
      writeInvOp(db, tx, op, auth.caller)
      writeAudit(tx, auth.caller, { action: 'stock.receive', entityType: 'product', entityId: productId, before: null, after: { qtyMilli, unitCostSen, supplierName, expiryDate, batchId: op.lines[0].batchId } })
    })
    return NextResponse.json({ ok: true, batchId: op.lines[0].batchId })
  } catch (error) {
    return handleRouteError('admin/inventory/receive', error, 'Could not save. Check your connection and try again.')
  }
}
