import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'
import { requireAdmin } from '@/lib/server/adminAuth'
import { writeAudit } from '@/lib/server/audit'
import { parseDraftCompletion } from '@/lib/server/draftInput'
import { Refused, handleRouteError, readJson } from '@/lib/server/http'

export const runtime = 'nodejs'

/** Complete a quick-added draft: details + status 'active' (then the
 *  inventory Cloud Function publishes it to the shop). One transaction with
 *  its audit entry. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  const { productId } = await params
  try {
    const input = parseDraftCompletion(await readJson(request))
    const db = getAdminDb()
    await db.runTransaction(async (tx) => {
      const ref = db.collection('products').doc(productId)
      const [snap, catSnap, srcSnap] = await tx.getAll(
        ref,
        db.collection('categories').doc(input.categoryId),
        db.collection('products').doc(input.repackSourceProductId ?? productId),
      )
      if (!snap.exists) throw new Refused('This product no longer exists.', 404)
      if (snap.get('status') !== 'draft') throw new Refused('This product was already completed (maybe on the iPad).', 409)
      if (!catSnap.exists) throw new Refused('That category no longer exists.', 400)
      if (input.repackSourceProductId && (!srcSnap.exists || input.repackSourceProductId === productId)) {
        throw new Refused('That bulk product no longer exists.', 400)
      }
      const sellPriceSen = input.sellPriceSen ?? (typeof snap.get('sellPrice') === 'number' ? snap.get('sellPrice') : null)
      const after = {
        name: input.name,
        nameZh: input.nameZh,
        categoryId: input.categoryId,
        category: String(catSnap.get('name') ?? ''),
        unitLabel: input.unitLabel,
        kind: input.kind,
        repackSourceProductId: input.repackSourceProductId,
        repackYield: input.repackYield,
        ...(sellPriceSen !== null && { sellPrice: sellPriceSen, price: sellPriceSen / 100 }),
        status: 'active',
        isActive: true,
      }
      tx.update(ref, { ...after, updatedAt: FieldValue.serverTimestamp(), updatedBy: auth.caller.uid })
      if (input.costSen !== null) {
        tx.set(db.collection('productCosts').doc(productId), { costPerUnitSen: input.costSen, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
      }
      writeAudit(tx, auth.caller, {
        action: 'draft.complete',
        entityType: 'product',
        entityId: productId,
        before: { status: 'draft', code: snap.get('code') ?? null },
        after: { ...after, ...(input.costSen !== null && { costPerUnitSen: input.costSen }) },
      })
    })
    return NextResponse.json({ ok: true, id: productId })
  } catch (error) {
    return handleRouteError('admin/drafts/complete', error, 'Could not save. Check your connection and try again.')
  }
}
