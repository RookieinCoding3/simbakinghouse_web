import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { requireAdmin } from '@/lib/server/adminAuth'
import { parseProductInput } from '@/lib/server/productInput'
import { saveProduct } from '@/lib/server/saveProduct'
import { readJson, handleRouteError } from '@/lib/server/http'

export const runtime = 'nodejs'

/** Update a product from the editor. */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  const { productId } = await params
  try {
    const input = parseProductInput(await readJson(request))
    await getAdminDb().runTransaction((tx) => saveProduct(tx, auth.caller, productId, input, 'update'))
    return NextResponse.json({ ok: true, id: productId })
  } catch (error) {
    return handleRouteError('admin/products/update', error, 'Could not save. Check your connection and try again.')
  }
}

/** The editor's private half: wholesale-only sell units (admin/owner only). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  const { productId } = await params
  try {
    const snap = await getAdminDb().collection('productPrivate').doc(productId).get()
    return NextResponse.json({ wholesaleUnits: snap.exists ? snap.data()?.wholesaleUnits ?? [] : [] })
  } catch (error) {
    return handleRouteError('admin/products/get', error)
  }
}
