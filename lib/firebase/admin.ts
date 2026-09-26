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
// keeps a missing env var from ever being able to break the build — and,
// just as importantly, keeps a *malformed* one (see parsePrivateKey below)
// from throwing anywhere except inside a function every caller in this
// codebase only ever invokes from within its own try/catch. A throw that
// somehow escaped that would surface as Vercel's generic static error
// page instead of this route's own JSON error response — which is
// exactly what happened here before this was hardened: getAdminDb() was
// already lazy, but initializeApp()/cert() failing on a malformed key
// wasn't defended against beyond that, and both known real-world causes
// below (a still-escaped key, wrapping quotes) throw synchronously from
// deep inside the SDK's PEM parsing.
let app: App | undefined

/**
 * Dashboards that only support single-line env values force the private
 * key to be pasted with literal backslash-n sequences instead of real
 * newlines, and some additionally store a copy-pasted leading/trailing
 * quote character as part of the value. Both fail PEM parsing silently
 * from firebase-admin's perspective (a cryptic crypto error, not a
 * helpful one) — normalise both before it ever reaches cert().
 */
function parsePrivateKey(raw: string): string {
  let key = raw.trim()
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1)
  }
  return key.replace(/\\n/g, '\n')
}

function getAdminApp(): App {
  if (app) return app

  const existing = getApps()
  if (existing.length > 0) {
    app = existing[0]
    return app
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !rawPrivateKey) {
    throw new Error(
      'Firebase Admin credentials are not configured (need FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY)'
    )
  }

  try {
    app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey: parsePrivateKey(rawPrivateKey) }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
  } catch (error) {
    // Re-thrown as a clearer, actionable message — still inside this
    // function, so it's still only ever reachable via a caller's own
    // try/catch, never at module load.
    throw new Error(
      `Firebase Admin failed to initialize (check FIREBASE_PRIVATE_KEY is a valid PEM key — real or \\n-escaped newlines, no wrapping quotes): ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
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
