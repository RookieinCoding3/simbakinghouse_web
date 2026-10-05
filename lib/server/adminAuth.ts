import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { verifyIdTokenClaims } from '@/lib/firebase/verifyIdToken'

export type AdminRole = 'admin' | 'owner'

export interface AdminCaller {
  uid: string
  email: string | null
  role: AdminRole
}

/** A doc with no role field is a pre-roles admin and counts as "owner". */
export function roleOf(data: Record<string, unknown> | undefined): AdminRole {
  return data?.role === 'admin' ? 'admin' : 'owner'
}

/**
 * The server-side gate for every admin API route: a valid Firebase ID token
 * (Authorization: Bearer …) whose uid has an admins/{uid} doc. Returns the
 * caller, or a ready-to-return 401/403 response. Pass `role: 'admin'` for
 * actions only the admin role may take (managing users).
 */
export async function requireAdmin(
  request: Request,
  opts: { role?: 'admin' } = {}
): Promise<{ ok: true; caller: AdminCaller } | { ok: false; response: NextResponse }> {
  const header = request.headers.get('Authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  const claims = await verifyIdTokenClaims(token)
  if (!claims) {
    return { ok: false, response: NextResponse.json({ error: 'Sign in again to continue.' }, { status: 401 }) }
  }
  const snap = await getAdminDb().collection('admins').doc(claims.uid).get()
  if (!snap.exists) {
    return { ok: false, response: NextResponse.json({ error: 'This account is not an admin.' }, { status: 403 }) }
  }
  const role = roleOf(snap.data())
  if (opts.role === 'admin' && role !== 'admin') {
    return { ok: false, response: NextResponse.json({ error: 'Only an admin can do this.' }, { status: 403 }) }
  }
  return { ok: true, caller: { uid: claims.uid, email: claims.email, role } }
}
