import { NextRequest, NextResponse } from 'next/server'
import type { Transaction } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'
import { requireAdmin, roleOf, type AdminRole } from '@/lib/server/adminAuth'
import { writeAudit } from '@/lib/server/audit'

export const runtime = 'nodejs'

class Refused extends Error {
  status: number
  constructor(message: string, status = 409) {
    super(message)
    this.status = status
  }
}

/** Counted inside the transaction, so two simultaneous demotions can't
 *  both see "there's still another admin" and leave none. */
async function adminCount(tx: Transaction): Promise<number> {
  const all = await tx.get(getAdminDb().collection('admins'))
  return all.docs.filter((d) => roleOf(d.data()) === 'admin').length
}

/** Change a user's role. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const auth = await requireAdmin(request, { role: 'admin' })
  if (!auth.ok) return auth.response
  const { uid } = await params
  const body = (await request.json().catch(() => null)) as { role?: unknown } | null
  const role: AdminRole | null = body?.role === 'admin' || body?.role === 'owner' ? body.role : null
  if (!role) return NextResponse.json({ error: 'Choose admin or owner.' }, { status: 400 })

  const db = getAdminDb()
  const ref = db.collection('admins').doc(uid)
  try {
    await db.runTransaction(async (tx) => {
      const count = await adminCount(tx)
      const snap = await tx.get(ref)
      if (!snap.exists) throw new Refused('This user is not on the list.', 404)
      const before = roleOf(snap.data())
      if (before === role) return
      if (before === 'admin' && role !== 'admin' && count <= 1) {
        throw new Refused('This is the last admin. Make someone else an admin first.')
      }
      tx.update(ref, { role })
      writeAudit(tx, auth.caller, { action: 'user.role', entityType: 'adminUser', entityId: uid, before: { role: before }, after: { role } })
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Refused) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[admin/users] role change failed:', error)
    return NextResponse.json({ error: 'Could not change the role.' }, { status: 500 })
  }
}

/** Remove a user from the admin list (their Firebase account itself is untouched). */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const auth = await requireAdmin(request, { role: 'admin' })
  if (!auth.ok) return auth.response
  const { uid } = await params
  if (uid === auth.caller.uid) {
    return NextResponse.json({ error: 'You cannot remove yourself.' }, { status: 400 })
  }
  const db = getAdminDb()
  const ref = db.collection('admins').doc(uid)
  try {
    await db.runTransaction(async (tx) => {
      const count = await adminCount(tx)
      const snap = await tx.get(ref)
      if (!snap.exists) throw new Refused('This user is not on the list.', 404)
      const before = roleOf(snap.data())
      if (before === 'admin' && count <= 1) throw new Refused('This is the last admin. Make someone else an admin first.')
      tx.delete(ref)
      writeAudit(tx, auth.caller, { action: 'user.remove', entityType: 'adminUser', entityId: uid, before: { role: before }, after: null })
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Refused) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[admin/users] remove failed:', error)
    return NextResponse.json({ error: 'Could not remove this user.' }, { status: 500 })
  }
}
