import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import app from './config'

// The one Auth instance for the whole app (customer site and admin alike).
// Being signed in is never sufficient to act as admin — Firestore/Storage
// rules and every admin API route additionally require the UID to have a
// doc in /admins, which no client can create (see firestore.rules).
export const auth = getAuth(app)

// Test-only: the E2E harness (scripts/test-env.sh) points this at the Auth
// emulator. Unset in every real deploy, so always a no-op in production.
const authEmulatorHost = process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST
if (authEmulatorHost && typeof window !== 'undefined') {
  connectAuthEmulator(auth, `http://${authEmulatorHost}`, { disableWarnings: true })
}

export function adminSignIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export function adminSignOut() {
  return signOut(auth)
}

export function onAdminAuthStateChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}
