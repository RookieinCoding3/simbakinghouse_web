import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth'
import app from './config'

// Admin-only sign-in. Being signed in is necessary but not sufficient to
// act as admin — Firestore/Storage rules additionally require the UID to
// have a doc in /admins, which nothing in this app can create (see
// firestore.rules). A signed-in non-admin user simply gets
// permission-denied from every admin read/write; see AdminGuard.
export const auth = getAuth(app)

export function adminSignIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export function adminSignOut() {
  return signOut(auth)
}

export function onAdminAuthStateChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}
