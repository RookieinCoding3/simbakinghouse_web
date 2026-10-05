'use client'

import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/lib/auth/AuthContext'
import { recordReads } from '@/lib/admin/readMetrics'

/**
 * The customer site's admin check, used by the account menu's
 * "Admin" link — both ask the same question the same way, a direct get on
 * admins/{uid} (see firestore.rules: a user may get their own admins/{uid}
 * doc, nothing else). Never by email, client-side role field, or anything
 * else guessable/spoofable — Firestore itself is the only source of truth,
 * and this just asks it.
 */
export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setIsAdmin(false)
      setChecking(false)
      return
    }
    let cancelled = false
    setChecking(true)
    getDoc(doc(db, 'admins', user.uid))
      .then((snap) => {
        recordReads(1)
        if (!cancelled) setIsAdmin(snap.exists())
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false)
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [user, authLoading])

  return { isAdmin, loading: authLoading || checking }
}
