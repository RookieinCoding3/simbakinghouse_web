import { createRemoteJWKSet, jwtVerify } from 'jose'

// Deliberately NOT firebase-admin/auth: that module eagerly requires
// jwks-rsa -> jose(ESM), which crashes with ERR_REQUIRE_ESM at import time
// (see lib/firebase/admin.ts for the full story — this is the same
// upstream bug, just reachable from a different firebase-admin submodule).
// Verifying a Firebase ID token server-side doesn't actually need the
// Admin SDK at all: it's a standard RS256 JWT, checkable against Google's
// own public JWKS with `jose` directly (the package firebase-admin itself
// depends on, just used the way it's meant to be — import(), not require()).
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
// createRemoteJWKSet caches fetched keys in memory for the life of this
// module (this const is created once per server instance, not per
// request) and only re-fetches on a cache miss, so a verified request
// doesn't normally cost a network round-trip to Google.
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

/** Verifies a Firebase Auth ID token and returns the signed-in user's uid,
 *  or null if the token is missing, expired, invalid, or malformed. Never
 *  throws. jwtVerify checks exp (and nbf/iat) automatically — rejecting
 *  anything expired is the library's default behavior, not opt-in. */
export async function verifyFirebaseIdToken(token: string | null): Promise<string | null> {
  if (!token || !PROJECT_ID) return null
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      algorithms: ['RS256'], // the only algorithm Firebase ever signs with — reject anything else outright
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
    })
    return typeof payload.sub === 'string' && payload.sub.length > 0 ? payload.sub : null
  } catch {
    return null
  }
}
