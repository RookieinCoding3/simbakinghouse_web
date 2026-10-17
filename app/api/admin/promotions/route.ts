import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { requireAdmin } from '@/lib/server/adminAuth'
import { writeAudit } from '@/lib/server/audit'
import { Refused, handleRouteError, readJson } from '@/lib/server/http'
import { parsePromotions, PromoError } from '@/lib/promotions/validate'

export const runtime = 'nodejs'

/** Sale events + the products to pick from. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const db = getAdminDb()
    const [doc, products] = await Promise.all([db.collection('settings').doc('promotions').get(), db.collection('products').get()])
    return NextResponse.json({
      promos: parsePromotions(doc.exists ? doc.data() : undefined).promos,
      products: products.docs
        .filter((d) => d.get('isDeleted') !== true && d.get('status') !== 'archived' && d.get('status') !== 'draft')
        .map((d) => ({ id: d.id, name: String(d.get('name') ?? ''), category: String(d.get('category') ?? ''), price: typeof d.get('price') === 'number' ? d.get('price') : null }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    })
  } catch (error) {
    return handleRouteError('admin/promotions/get', error)
  }
}

/** Save all sale events (validated; settings/promotions, public read). */
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  try {
    let parsed
    try {
      parsed = parsePromotions(await readJson(request), true)
    } catch (e) {
      throw new Refused(e instanceof PromoError ? e.message : 'Could not read the sale events.', 400)
    }
    const db = getAdminDb()
    const ref = db.collection('settings').doc('promotions')
    await db.runTransaction(async (tx) => {
      const before = await tx.get(ref)
      tx.set(ref, { promos: parsed.promos, updatedAt: new Date().toISOString(), updatedBy: auth.caller.uid })
      writeAudit(tx, auth.caller, {
        action: 'promotions.save',
        entityType: 'settings',
        entityId: 'promotions',
        before: { count: before.exists ? (before.get('promos') ?? []).length : 0 },
        after: { count: parsed.promos.length, live: parsed.promos.filter((p) => p.active).map((p) => p.name) },
      })
    })
    return NextResponse.json({ ok: true, promos: parsed.promos })
  } catch (error) {
    return handleRouteError('admin/promotions/put', error, 'Could not save. Check your connection and try again.')
  }
}
