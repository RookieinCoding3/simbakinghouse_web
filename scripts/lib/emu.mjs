// Shared helpers for E2E suites run inside scripts/test-env.sh. Every
// function here refuses to run unless the emulator env vars are set, so
// nothing in a test can ever reach a real Firebase project.
import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const FS = process.env.FIRESTORE_EMULATOR_HOST
const AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST

if (!FS || !AUTH || !PROJECT?.startsWith('demo-')) {
  throw new Error('Refusing to run: not inside scripts/test-env.sh (emulator env vars / demo- project missing)')
}

export const BASE_URL = process.env.BASE_URL || 'http://localhost:3100'

export function db() {
  const app = getApps()[0] ?? initializeApp({ projectId: PROJECT })
  return getFirestore(app)
}

export async function resetEmulators() {
  await fetch(`http://${FS}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' })
  await fetch(`http://${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' })
}

/** Creates an email/password user in the Auth emulator; returns { uid, email, password, idToken }. */
export async function createUser(email, password = 'test-password-123') {
  const res = await fetch(
    `http://${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  )
  const json = await res.json()
  if (!res.ok) throw new Error(`createUser failed: ${JSON.stringify(json)}`)
  return { uid: json.localId, email, password, idToken: json.idToken }
}

export async function signIn(email, password = 'test-password-123') {
  const res = await fetch(
    `http://${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  )
  const json = await res.json()
  if (!res.ok) throw new Error(`signIn failed: ${JSON.stringify(json)}`)
  return json.idToken
}

/** Creates a user and grants admins/{uid}. role undefined = legacy doc with no role field. */
export async function createAdmin(email, role) {
  const user = await createUser(email)
  await db().collection('admins').doc(user.uid).set(role ? { role } : { addedAt: Date.now() })
  return user
}

let passed = 0
let failed = 0
export async function check(name, run) {
  try {
    await run()
    console.log(`PASS  ${name}`)
    passed++
  } catch (e) {
    console.log(`FAIL  ${name}`)
    console.log(`      ${String(e?.message || e).split('\n')[0]}`)
    failed++
  }
}
export function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}
export function summary() {
  console.log(`\n${passed} passed, ${failed} failed`)
  return failed
}
