import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'
import { requireAdmin, roleOf, type AdminRole } from '@/lib/server/adminAuth'
import { lookupUserByEmail, lookupUsersByUid } from '@/lib/server/identityToolkit'
import { writeAudit } from '@/lib/server/audit'

export const runtime = 'nodejs'

/** List admin and owner users. Admin role only — the admins collection is
 *  never readable as a list from any client (firestore.rules). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, { role: 'admin' })
  if (!auth.ok) return auth.response
  try {
    const snap = await getAdminDb().collection('admins').get()
    const accounts = await lookupUsersByUid(snap.docs.map((d) => d.id))
    const users = snap.docs
      .map((d) => {
        const data = d.data()
        const account = accounts.get(d.id)
        return {
          uid: d.id,
          email: account?.email ?? null,
          displayName: account?.displayName ?? null,
          signInMethods: account?.providers ?? [],
          role: roleOf(data),
          roleIsImplicit: data.role !== 'admin' && data.role !== 'owner',
          isYou: d.id === auth.caller.uid,
        }
      })
      .sort((a, b) => (a.role === b.role ? (a.email ?? '').localeCompare(b.email ?? '') : a.role === 'admin' ? -1 : 1))
    return NextResponse.json({ users })
  } catch (error) {
    console.error('[admin/users] list failed:', error)
    return NextResponse.json({ error: 'Could not load users.' }, { status: 500 })
  }
}

/** Add an existing Firebase Auth account (looked up by email) as admin or owner. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, { role: 'admin' })
  if (!auth.ok) return auth.response
  const body = (await request.json().catch(() => null)) as { email?: unknown; role?: unknown } | null
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const role: AdminRole | null = body?.role === 'admin' || body?.role === 'owner' ? body.role : null
  if (!email || !role) return NextResponse.json({ error: 'Enter an email and choose a role.' }, { status: 400 })

  try {
    const account = await lookupUserByEmail(email)
    if (!account) {
      return NextResponse.json(
        {
          error: `No account uses ${email} yet. Ask them to sign in once at /admin/login (with Google, or by creating a shop account), then add them here.`,
        },
        { status: 404 }
      )
    }
    const db = getAdminDb()
    const ref = db.collection('admins').doc(account.uid)
    const result = await db.runTransaction(async (tx) => {
      const existing = await tx.get(ref)
      if (existing.exists) return { conflict: roleOf(existing.data()) }
      const doc = { role, addedAt: FieldValue.serverTimestamp(), addedBy: auth.caller.uid }
      tx.set(ref, doc)
      writeAudit(tx, auth.caller, {
        action: 'user.add',
        entityType: 'adminUser',
        entityId: account.uid,
        before: null,
        after: { email, role },
      })
      return { conflict: null }
    })
    if (result.conflict) {
      return NextResponse.json({ error: `${email} is already an ${result.conflict}.` }, { status: 409 })
    }
    return NextResponse.json({ ok: true, uid: account.uid }, { status: 201 })
  } catch (error) {
    console.error('[admin/users] add failed:', error)
    return NextResponse.json({ error: 'Could not add this user.' }, { status: 500 })
  }
}
