'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth } from '@/lib/firebase/auth'
import { db } from '@/lib/firebase/config'
import { recordReads } from './readMetrics'
import { resetProductsStore } from './productsStore'
import { clearCachedOrders } from './ordersCache'
import { inventoryStore, draftsStore, privateStore, runningLowStore } from './collectionStore'

export type AdminRole = 'admin' | 'owner'

export type AdminPhase = 'loading' | 'signed-out' | 'checking' | 'admin' | 'not-admin' | 'error'

export interface AdminSessionValue {
  phase: AdminPhase
  user: User | null
  role: AdminRole | null
  /** Auth is still restoring, but this device's last session was a verified
   *  admin — safe to paint cached UI optimistically meanwhile. */
  likelyAdmin: boolean
  /** Set when an account was just turned away; survives the sign-out it triggers. */
  rejected: { uid: string; email: string | null } | null
  retry: () => void
  signOutAdmin: () => Promise<void>
  clearRejected: () => void
}

const AdminSessionContext = createContext<AdminSessionValue | null>(null)

// UI convenience only: this verdict decides what to *show* first, never
// what's allowed. Every admin read/write is still enforced by Firestore
// rules / server routes against admins/{uid}.
const VERDICT_KEY = 'sbh-admin-verdict'

function readCachedRole(uid: string): AdminRole | null {
  try {
    const raw = localStorage.getItem(VERDICT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { uid?: string; role?: string }
    if (parsed.uid !== uid) return null
    return parsed.role === 'admin' ? 'admin' : parsed.role === 'owner' ? 'owner' : null
  } catch {
    return null
  }
}

function writeCachedRole(uid: string, role: AdminRole | null) {
  try {
    if (role) localStorage.setItem(VERDICT_KEY, JSON.stringify({ uid, role }))
    else localStorage.removeItem(VERDICT_KEY)
  } catch {
    // Storage blocked (private mode) — just no instant paint next time.
  }
}

/** The one admin check: does admins/{uid} exist? A doc with no role field
 *  is a pre-roles admin and counts as "owner". */
export async function fetchAdminRole(uid: string): Promise<AdminRole | null> {
  const snap = await getDoc(doc(db, 'admins', uid))
  recordReads(1)
  if (!snap.exists()) return null
  return snap.data()?.role === 'admin' ? 'admin' : 'owner'
}

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<AdminPhase>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<AdminRole | null>(null)
  const [rejected, setRejected] = useState<AdminSessionValue['rejected']>(null)
  const checkSeq = useRef(0)
  const [hadVerdict, setHadVerdict] = useState(false)

  useEffect(() => {
    try {
      setHadVerdict(!!localStorage.getItem(VERDICT_KEY))
    } catch {}
  }, [])

  const runCheck = useCallback((u: User) => {
    const seq = ++checkSeq.current
    const cached = readCachedRole(u.uid)
    if (cached) {
      setRole(cached)
      setPhase('admin')
    } else {
      setPhase('checking')
    }
    fetchAdminRole(u.uid)
      .then((r) => {
        if (seq !== checkSeq.current) return
        writeCachedRole(u.uid, r)
        if (r) {
          setRole(r)
          setPhase('admin')
        } else {
          setRole(null)
          setPhase('not-admin')
        }
      })
      .catch(() => {
        if (seq !== checkSeq.current) return
        // Offline / transient: keep an optimistic admin view if we had one
        // (rules still guard every read); otherwise say we couldn't check.
        if (!cached) setPhase('error')
      })
  }, [])

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      if (!u) {
        resetProductsStore()
        clearCachedOrders()
        inventoryStore.reset()
        draftsStore.reset()
        privateStore.reset()
        runningLowStore.reset()
        checkSeq.current++
        setRole(null)
        setPhase('signed-out')
        return
      }
      runCheck(u)
    })
  }, [runCheck])

  // A signed-in non-admin is turned away: remember who (to show the UID),
  // then sign them out so nothing else in admin runs under that account.
  useEffect(() => {
    if (phase !== 'not-admin' || !user) return
    setRejected({ uid: user.uid, email: user.email })
    void signOut(auth)
  }, [phase, user])

  const value: AdminSessionValue = {
    phase,
    user,
    role,
    likelyAdmin: phase === 'loading' && hadVerdict,
    rejected,
    retry: () => {
      if (user) runCheck(user)
    },
    signOutAdmin: async () => {
      if (user) writeCachedRole(user.uid, null)
      await signOut(auth)
    },
    clearRejected: () => setRejected(null),
  }

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>
}

export function useAdminSession(): AdminSessionValue {
  const ctx = useContext(AdminSessionContext)
  if (!ctx) throw new Error('useAdminSession must be used within AdminSessionProvider')
  return ctx
}
