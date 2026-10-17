import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { requireAdmin } from '@/lib/server/adminAuth'
import { handleRouteError } from '@/lib/server/http'

export const runtime = 'nodejs'

/** Products quick-added on the iPad and waiting for details, plus what the
 *  form needs (categories, bulk products to link repacks to). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const db = getAdminDb()
    const [drafts, categories, bulks] = await Promise.all([
      db.collection('products').where('status', '==', 'draft').get(),
      db.collection('categories').get(),
      db.collection('products').where('kind', '==', 'bulk').get(),
    ])
    // Stock on hand per draft (all places): quantity 0 must be counted on the
    // iPad before the draft can be completed.
    const onHand = new Map<string, number>()
    const ids = drafts.docs.map((d) => d.id)
    for (let i = 0; i < ids.length; i += 30) {
      const levels = await db.collection('stockLevels').where('productId', 'in', ids.slice(i, i + 30)).get()
      for (const l of levels.docs) onHand.set(l.get('productId'), (onHand.get(l.get('productId')) ?? 0) + Number(l.get('onHandMilli') ?? 0))
    }
    const ms = (v: unknown) => (v && typeof v === 'object' && 'toMillis' in v ? (v as { toMillis: () => number }).toMillis() : 0)
    return NextResponse.json({
      drafts: drafts.docs
        .map((d) => ({
          id: d.id,
          code: String(d.get('code') ?? ''),
          imageUrl: (Array.isArray(d.get('imageUrls')) ? d.get('imageUrls')[0] : null) ?? d.get('imageUrl') ?? null,
          sellPriceSen: typeof d.get('sellPrice') === 'number' ? d.get('sellPrice') : null,
          categoryId: d.get('categoryId') ?? null,
          unitLabel: d.get('unitLabel') ?? 'pack',
          kind: d.get('kind') ?? 'standard',
          repackSourceProductId: d.get('repackSourceProductId') ?? null,
          scannedAt: ms(d.get('createdAt')),
          onHandMilli: onHand.get(d.id) ?? 0,
        }))
        .sort((a, b) => a.scannedAt - b.scannedAt),
      categories: categories.docs
        .filter((d) => d.get('isActive') !== false)
        .map((d) => ({ id: d.id, name: String(d.get('name') ?? ''), nameZh: String(d.get('nameZh') ?? ''), order: Number(d.get('order') ?? 99) }))
        .sort((a, b) => a.order - b.order),
      bulks: bulks.docs
        .filter((d) => d.get('status') !== 'archived')
        .map((d) => ({ id: d.id, code: String(d.get('code') ?? ''), name: String(d.get('name') || d.get('code') || '') })),
    })
  } catch (error) {
    return handleRouteError('admin/drafts/list', error)
  }
}
