import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { requireAdmin } from '@/lib/server/adminAuth'
import { readStockConfig } from '@/lib/inventory/catalog'
import { checkInvariants, type ItemState } from '@/lib/inventory/engine'
import { handleRouteError } from '@/lib/server/http'

export const runtime = 'nodejs'

/**
 * Consistency check: for every inventory doc, on-hand and reserved must
 * equal the sum of the ledger (stockMovements), and for expiry-tracked
 * products the batches must add up to on-hand. Read-only.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const db = getAdminDb()
    const [inv, movements, batches] = await Promise.all([
      db.collection('inventory').get(),
      db.collection('stockMovements').get(),
      db.collection('batches').get(),
    ])
    const ledger = new Map<string, { onHandDeltaMilli: number; reservedDeltaMilli: number }[]>()
    for (const d of movements.docs) {
      const m = d.data()
      const list = ledger.get(m.productId) ?? []
      list.push({ onHandDeltaMilli: Number(m.onHandDeltaMilli) || 0, reservedDeltaMilli: Number(m.reservedDeltaMilli) || 0 })
      ledger.set(m.productId, list)
    }
    const productIds = inv.docs.map((d) => d.id)
    const productSnaps = productIds.length ? await db.getAll(...productIds.map((id) => db.collection('products').doc(id))) : []
    const problems: { productId: string; problems: string[] }[] = []
    for (const [i, d] of inv.docs.entries()) {
      const data = d.data()
      const config = readStockConfig(productSnaps[i].data())
      const state: ItemState = {
        onHandMilli: Number(data.onHandMilli) || 0,
        reservedMilli: Number(data.reservedMilli) || 0,
        trackExpiry: config.trackExpiry,
        batches: batches.docs
          .filter((b) => b.data().productId === d.id)
          .map((b) => ({ id: b.id, qtyMilli: Number(b.data().qtyMilli) || 0, expiryDate: b.data().expiryDate ?? null, receivedAt: 0 })),
      }
      const p = checkInvariants(state, ledger.get(d.id) ?? [])
      if (p.length) problems.push({ productId: d.id, problems: p })
    }
    return NextResponse.json({ ok: problems.length === 0, checked: inv.size, problems })
  } catch (error) {
    return handleRouteError('admin/stock/check', error)
  }
}
