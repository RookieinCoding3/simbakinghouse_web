import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'
import { requireAdmin } from '@/lib/server/adminAuth'
import { writeAudit } from '@/lib/server/audit'
import { StockSession, opAlreadyDone, claimOp } from '@/lib/server/stock'
import { count } from '@/lib/inventory/engine'
import { deriveStockStatus } from '@/lib/inventory/catalog'
import { availableMilli } from '@/lib/inventory/engine'
import { Refused, readJson, handleRouteError, isOpId } from '@/lib/server/http'

export const runtime = 'nodejs'

/**
 * Switches products to "managed here" (on) or back (off).
 *
 * On: every product must have a completed count (an opening-count draft
 * from stock count mode — an explicit 0 counts) and Sim must confirm the old
 * system is no longer used for them. Only then is the inventory doc created
 * from that count, and only for those products — nothing else in the
 * catalogue is touched. Off: the product sells exactly as before (no status,
 * no checks); its inventory and history are kept.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  const b = await readJson(request)
  const ids = Array.isArray(b.productIds) ? [...new Set(b.productIds.filter((x): x is string => typeof x === 'string'))] : []
  if (!isOpId(b.opId) || ids.length === 0 || ids.length > 300 || typeof b.on !== 'boolean') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  if (b.on && b.confirmOldSystemStopped !== true) {
    return NextResponse.json(
      { error: 'Confirm that the old system will no longer be used for these products.' },
      { status: 400 }
    )
  }
  const opId = b.opId
  const db = getAdminDb()

  try {
    const result = await db.runTransaction(async (tx) => {
      if (await opAlreadyDone(tx, opId)) return { duplicate: true, switched: 0 }
      const draftSnaps = b.on ? await tx.getAll(...ids.map((id) => db.collection('stockCountDrafts').doc(id))) : []
      const session = new StockSession(tx, auth.caller)
      await session.load(ids)

      const missing: string[] = []
      for (const [i, id] of ids.entries()) {
        const it = session.item(id)
        if (!it.product) throw new Refused('A product in this list no longer exists. Refresh and try again.', 404)
        if (b.on && !it.config.managed && !draftSnaps[i].exists) missing.push(String(it.product.name ?? id))
      }
      if (missing.length) {
        throw new Refused(`Count these first (enter 0 if there are none): ${missing.join(', ')}.`, 409, { missing })
      }

      let switched = 0
      for (const [i, id] of ids.entries()) {
        const it = session.item(id)
        if (b.on) {
          if (it.config.managed) continue
          const counted = Number(draftSnaps[i].data()!.countedMilli)
          // The engine must see the product as managed from here on.
          it.config = { ...it.config, managed: true }
          const m = session.apply(id, (s) => count(s, counted, { batch: { id: session.newBatchId(), expiryDate: null, receivedAt: Date.now() } }), { opId, note: 'opening count — switched to managed' })
          if (!m) it.touched = true
          const status = deriveStockStatus(availableMilli(it.state), it.config.lowStockThresholdMilli)
          tx.update(it.productRef, { managedStock: true, stockStatus: status, managedSince: FieldValue.serverTimestamp() })
          it.product = { ...it.product, stockStatus: status }
          tx.delete(draftSnaps[i].ref)
          switched++
        } else {
          if (!it.config.managed) continue
          tx.update(it.productRef, { managedStock: false, stockStatus: FieldValue.delete() })
          switched++
        }
      }
      claimOp(tx, opId, auth.caller, b.on ? 'manage:on' : 'manage:off')
      session.commit({ lastCountedAt: !!b.on })
      writeAudit(tx, auth.caller, {
        action: b.on ? 'stock.manage.on' : 'stock.manage.off',
        entityType: 'product',
        entityId: ids.join(','),
        before: null,
        after: { productIds: ids, switched },
        note: b.on ? 'Confirmed: the old system is no longer used for these products.' : undefined,
      })
      return { duplicate: false, switched }
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return handleRouteError('admin/stock/manage', error)
  }
}
