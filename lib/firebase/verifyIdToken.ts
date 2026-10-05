import { createRemoteJWKSet, decodeJwt, jwtVerify } from 'jose'

// Deliberately NOT firebase-admin/auth: that module eagerly requires
// jwks-rsa -> jose(ESM), which crashes with ERR_REQUIRE_ESM at import time
// (see lib/firebase/admin.ts for the full story — this is the same
// upstream bug, just reachable from a different firebase-admin submodule).
// Verifying a Firebase ID token server-side doesn't actually need the
// Admin SDK at all: it's a standard RS256 JWT, checkable against Google's
// own public JWKS with `jose` directly.
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
// createRemoteJWKSet caches fetched keys in memory for the life of this
// module and only re-fetches on a cache miss.
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

// The Auth emulator issues unsigned tokens. Accept them only when BOTH the
// emulator env var is set AND the project is a demo- project — Firebase's
// reserved prefix for emulator-only projects that can't exist in
// production — so a stray env var on a real deploy can never turn
// signature checking off for the real project.
const EMULATOR = !!process.env.FIREBASE_AUTH_EMULATOR_HOST && !!PROJECT_ID?.startsWith('demo-')

export interface VerifiedIdToken {
  uid: string
  email: string | null
}

/** Verifies a Firebase Auth ID token. Returns null if the token is missing,
 *  expired, invalid, or malformed. Never throws. */
export async function verifyIdTokenClaims(token: string | null): Promise<VerifiedIdToken | null> {
  if (!token || !PROJECT_ID) return null
  try {
    let payload: Record<string, unknown>
    if (EMULATOR) {
      payload = decodeJwt(token)
      const exp = typeof payload.exp === 'number' ? payload.exp : 0
      if (payload.aud !== PROJECT_ID || exp * 1000 < Date.now()) return null
    } else {
      ;({ payload } = await jwtVerify(token, JWKS, {
        algorithms: ['RS256'], // the only algorithm Firebase ever signs with
        issuer: `https://securetoken.google.com/${PROJECT_ID}`,
        audience: PROJECT_ID,
      }))
    }
    const uid = typeof payload.sub === 'string' && payload.sub.length > 0 ? payload.sub : null
    if (!uid) return null
    return { uid, email: typeof payload.email === 'string' ? payload.email : null }
  } catch {
    return null
  }
}

/** The signed-in user's uid, or null. Kept for app/api/orders' optional
 *  "attach this order to my account" check. */
export async function verifyFirebaseIdToken(token: string | null): Promise<string | null> {
  return (await verifyIdTokenClaims(token))?.uid ?? null
}
