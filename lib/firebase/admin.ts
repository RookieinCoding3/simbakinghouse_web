import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getStorage, type Storage } from 'firebase-admin/storage'
import { getAppCheck } from 'firebase-admin/app-check'

// Server-only. Never import this from a Client Component or anything that
// could end up in the browser bundle — FIREBASE_PRIVATE_KEY is a real
// secret, unlike the NEXT_PUBLIC_FIREBASE_* values used client-side.
//
// Lazy by design: nothing in this module executes at import time, only
// when getAdminDb() is actually called from inside a route handler. That
// keeps a missing env var from ever being able to break the build.
let app: App | undefined

function getAdminApp(): App {
  if (app) return app

  const existing = getApps()
  if (existing.length > 0) {
    app = existing[0]
    return app
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin credentials are not configured (need FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY)'
    )
  }

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  })
  return app
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp())
}

export function getAdminStorage(): Storage {
  return getStorage(getAdminApp())
}

/**
 * Verifies an App Check token from the X-Firebase-AppCheck header (see
 * lib/firebase/appCheck.ts on the client side). Returns true if valid,
 * false otherwise — including when App Check isn't configured
 * (NEXT_PUBLIC_RECAPTCHA_SITE_KEY unset) or the header is missing, so
 * callers that want App Check as an *additional* layer rather than a
 * hard requirement (see app/api/orders/route.ts) can log/monitor a
 * false without necessarily rejecting the request outright while it's
 * being rolled out.
 */
export async function verifyAppCheckToken(token: string | null): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || !token) return false
  try {
    await getAppCheck(getAdminApp()).verifyToken(token)
    return true
  } catch {
    return false
  }
}
