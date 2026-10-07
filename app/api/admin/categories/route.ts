import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'
import { requireAdmin } from '@/lib/server/adminAuth'
import { writeAudit } from '@/lib/server/audit'
import { SHOP_ID } from '@/lib/server/stock'
import { Refused, readJson, handleRouteError } from '@/lib/server/http'

export const runtime = 'nodejs'

function keyOf(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Adds a category (English name, optional Chinese name). Refuses a name that
 * already exists in any letter case — whether as a category doc or as a
 * category some product already uses.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  const b = await readJson(request)
  const name = typeof b.name === 'string' ? b.name.trim().replace(/\s+/g, ' ').slice(0, 60) : ''
  const nameZh = typeof b.nameZh === 'string' ? b.nameZh.trim().slice(0, 60) : ''
  if (!name) return NextResponse.json({ error: 'Enter a category name.' }, { status: 400 })
  const key = keyOf(name)
  const db = getAdminDb()
  const docId = key.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `c-${Date.now()}`

  try {
    await db.runTransaction(async (tx) => {
      const [cats, products] = await Promise.all([tx.get(db.collection('categories')), tx.get(db.collection('products').select('category'))])
      const existing = [
        ...cats.docs.map((d) => String(d.data().name ?? '')),
        ...products.docs.map((d) => String(d.data().category ?? '')),
      ].find((n) => n && keyOf(n) === key)
      if (existing) throw new Refused(`"${existing}" already exists. Pick it from the list instead.`)
      tx.set(db.collection('categories').doc(docId), {
        shopId: SHOP_ID,
        name,
        ...(nameZh && { nameZh }),
        nameKey: key,
        trackExpiryDefault: true,
        createdAt: FieldValue.serverTimestamp(),
      })
      writeAudit(tx, auth.caller, { action: 'category.create', entityType: 'category', entityId: docId, before: null, after: { name, nameZh } })
    })
    return NextResponse.json({ ok: true, id: docId, name }, { status: 201 })
  } catch (error) {
    return handleRouteError('admin/categories', error)
  }
}
