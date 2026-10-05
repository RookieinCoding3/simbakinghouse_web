'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase/auth'

// Same Firebase Auth instance the admin uses — there's only ever one;
// "admin" vs "customer" is purely whether the UID has an admins/{uid} doc.
export { auth }

interface AuthContextValue {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOutUser: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const value: AuthContextValue = {
    user,
    loading,
    signInWithEmail: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password)
    },
    signUpWithEmail: async (email, password) => {
      await createUserWithEmailAndPassword(auth, email, password)
    },
    // Popup-based: works in a normal browser tab. Known limitation — some
    // installed-PWA/standalone contexts (notably iOS) don't support
    // popups well; email/password still works there as a fallback.
    signInWithGoogle: async () => {
      await signInWithPopup(auth, new GoogleAuthProvider())
    },
    signOutUser: async () => {
      await signOut(auth)
    },
    sendPasswordReset: async (email) => {
      await sendPasswordResetEmail(auth, email)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
