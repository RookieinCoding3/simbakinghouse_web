'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { collection, getDocs, limit, query } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { onAdminAuthStateChanged, adminSignOut } from '@/lib/firebase/auth'
import type { User } from 'firebase/auth'

type GuardState = 'checking' | 'signed-out' | 'not-admin' | 'ok'

/**
 * Being signed in to Firebase Auth is necessary but not sufficient to act
 * as admin — Firestore rules additionally require a matching doc in
 * /admins, which nothing client-side can read directly (that collection
 * is `allow read, write: if false` even for its own admins — see
 * firestore.rules). So authorization can only be confirmed by attempting
 * a real admin-gated read and checking whether it's rejected.
 */
export default function AdminGuard({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GuardState>('checking')
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAdminAuthStateChanged(async (user: User | null) => {
      if (!user) {
        setState('signed-out')
        router.replace('/admin/login')
        return
      }
      try {
        // Cheapest possible admin-gated read, just to probe authorization.
        await getDocs(query(collection(db, 'orders'), limit(1)))
        setState('ok')
      } catch {
        setState('not-admin')
      }
    })
    return unsubscribe
  }, [router])

  if (state === 'checking' || state === 'signed-out') {
    return (
      <main className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-sm text-muted">Loading…</p>
      </main>
    )
  }

  if (state === 'not-admin') {
    return (
      <main className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="font-heading text-ink text-2xl mb-3">Not authorized</h1>
          <p className="text-sm text-muted mb-6">
            This account is signed in but isn&apos;t on the admin list. Ask whoever manages the
            Firebase project to add your account.
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
