import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { requireAdmin } from '@/lib/server/adminAuth'
import { parseProductInput } from '@/lib/server/productInput'
import { saveProduct } from '@/lib/server/saveProduct'
import { readJson, handleRouteError } from '@/lib/server/http'

export const runtime = 'nodejs'

/** Create a product. The editor may pass its own id (so a photo can be
 *  uploaded to products/{id} before saving); otherwise one is made. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const b = await readJson(request)
    const input = parseProductInput(b)
    const id = typeof b.id === 'string' && /^[A-Za-z0-9_-]{8,40}$/.test(b.id) ? b.id : crypto.randomBytes(10).toString('hex')
    await getAdminDb().runTransaction((tx) => saveProduct(tx, auth.caller, id, input, 'create'))
    return NextResponse.json({ ok: true, id }, { status: 201 })
  } catch (error) {
    return handleRouteError('admin/products', error, 'Could not save. Check your connection and try again.')
  }
}
