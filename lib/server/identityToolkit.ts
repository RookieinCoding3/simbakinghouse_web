import { getAdminAccessToken } from '@/lib/firebase/admin'
import { SITE_URL } from '@/lib/site'

// Firebase Auth's own REST API (Identity Toolkit), called with the service
// account's token. This is what firebase-admin/auth does internally; it's
// used directly because importing firebase-admin/auth crashes the
// serverless function at load time (see lib/firebase/admin.ts).
// Under the Auth emulator the same endpoints exist locally, and the
// emulator accepts "Bearer owner" as an admin credential.

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
const EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST

function base(): string {
  return EMULATOR_HOST
    ? `http://${EMULATOR_HOST}/identitytoolkit.googleapis.com/v1`
    : 'https://identitytoolkit.googleapis.com/v1'
}

async function adminHeaders(): Promise<Record<string, string>> {
  const token = EMULATOR_HOST ? 'owner' : await getAdminAccessToken()
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  providers: string[]
  disabled: boolean
}

function toAuthUser(u: Record<string, unknown>): AuthUser {
  const providerInfo = Array.isArray(u.providerUserInfo) ? (u.providerUserInfo as { providerId?: string }[]) : []
  return {
    uid: String(u.localId),
    email: typeof u.email === 'string' ? u.email : null,
    displayName: typeof u.displayName === 'string' ? u.displayName : null,
    providers: providerInfo.map((p) => p.providerId ?? '').filter(Boolean),
    disabled: u.disabled === true,
  }
}

async function lookup(body: Record<string, unknown>): Promise<AuthUser[]> {
  const res = await fetch(`${base()}/projects/${PROJECT_ID}/accounts:lookup`, {
    method: 'POST',
    headers: await adminHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`accounts:lookup failed (${res.status})`)
  const json = (await res.json()) as { users?: Record<string, unknown>[] }
  return (json.users ?? []).map(toAuthUser)
}

export async function lookupUserByEmail(email: string): Promise<AuthUser | null> {
  const users = await lookup({ email: [email.trim().toLowerCase()] })
  return users[0] ?? null
}

export async function lookupUsersByUid(uids: string[]): Promise<Map<string, AuthUser>> {
  const map = new Map<string, AuthUser>()
  if (uids.length === 0) return map
  for (const u of await lookup({ localId: uids })) map.set(u.uid, u)
  return map
}

/**
 * Sends Firebase's own "reset your password" email. For an account that
 * only ever signed in with Google, completing it ADDS a password to that
 * same account (same uid) — verified against the Auth emulator; see
 * scripts/admin.test.mjs. Tries with a link back to /admin/login first,
 * and without one if the domain isn't on Firebase's authorized list.
 */
export async function sendPasswordSetupEmail(email: string): Promise<void> {
  const send = (continueUrl?: string) =>
    fetch(`${base()}/accounts:sendOobCode?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType: 'PASSWORD_RESET', email, ...(continueUrl && { continueUrl }) }),
    })
  let res = await send(`${SITE_URL}/admin/login`)
  if (!res.ok) res = await send()
  if (!res.ok) throw new Error(`sendOobCode failed (${res.status})`)
}
