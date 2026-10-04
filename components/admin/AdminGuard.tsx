'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { useIsAdmin } from '@/lib/admin/useIsAdmin'
import { adminSignOut } from '@/lib/firebase/auth'

/**
 * Checks admins/{uid} directly (see lib/admin/useIsAdmin.ts and the
 * matching firestore.rules entry — a user may get their own admins/{uid}
 * doc, nothing else). This used to infer admin status indirectly, from
 * whether an unrelated `orders` read happened to succeed — which also
 * fails for any other reason (network blip, offline, a transient
 * Firestore error), silently misreporting a real admin as "not
 * authorized" with no way to tell the two cases apart. A direct read of
 * the actual thing being asked about doesn't have that failure mode.
 */
export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin, loading: adminLoading } = useIsAdmin()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/admin/login')
    }
  }, [authLoading, user, router])

  if (authLoading || adminLoading || !user) {
    return (
      <main className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-sm text-muted">Loading…</p>
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="font-heading text-ink text-2xl mb-3">Not authorized</h1>
          <p className="text-sm text-muted mb-4">
            This account is signed in but isn&apos;t on the admin list.
          </p>
          <p className="text-sm text-muted mb-1">Ask the owner to add this ID:</p>
          <p className="font-mono text-xs bg-sand border border-line px-3 py-2 mb-6 break-all select-all">
            {user.uid}
          </p>
          <button
            onClick={() => adminSignOut()}
            className="text-xs uppercase tracking-widest underline text-clay"
          >
            Sign out
          </button>
        </div>
      </main>
    )
  }

  return <>{children}</>
}
