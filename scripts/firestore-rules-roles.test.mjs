// Role matrix for firestore.rules: signed-out, customer, owner, admin and a
// legacy admin doc with no role, against every collection. Owner and admin
// get identical client access — what only "admin" may do (manage users)
// happens solely through server routes, never a client write.
//
// Run with: firebase emulators:exec --only firestore "node scripts/firestore-rules-roles.test.mjs"
import { readFileSync } from 'fs'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore'

const testEnv = await initializeTestEnvironment({
  projectId: 'demo-sbh-rules-roles',
  firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
})

await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore()
  await setDoc(doc(db, 'admins', 'kin'), { role: 'admin' })
  await setDoc(doc(db, 'admins', 'sim'), { role: 'owner' })
  await setDoc(doc(db, 'admins', 'legacy'), { addedAt: 1 })
  await setDoc(doc(db, 'orders', 'SBH-1'), { status: 'new', items: [] })
  await setDoc(doc(db, 'products', 'p1'), { name: 'Flour', price: 5, category: 'Flour' })
  await setDoc(doc(db, 'categories', 'c1'), { name: 'Flour' })
  await setDoc(doc(db, 'settings', 'shop'), { shopOpensAt: '6:30 AM' })
  await setDoc(doc(db, 'auditLog', 'a1'), { action: 'user.add' })
  await setDoc(doc(db, 'counters', 'orders'), { seq: 1 })
  await setDoc(doc(db, 'rateLimits', 'global'), { count: 1 })
  await setDoc(doc(db, 'carts', 'cust'), { items: [] })
})

const PERSONAS = {
  'signed-out': testEnv.unauthenticatedContext().firestore(),
  customer: testEnv.authenticatedContext('cust').firestore(),
  owner: testEnv.authenticatedContext('sim').firestore(),
  admin: testEnv.authenticatedContext('kin').firestore(),
  'legacy (no role)': testEnv.authenticatedContext('legacy').firestore(),
}
const STAFF = new Set(['owner', 'admin', 'legacy (no role)'])
const uidOf = { 'signed-out': null, customer: 'cust', owner: 'sim', admin: 'kin', 'legacy (no role)': 'legacy' }

let passed = 0
let failed = 0
async function expect(persona, label, allowed, run) {
  try {
    await (allowed ? assertSucceeds(run()) : assertFails(run()))
    passed++
  } catch (e) {
    failed++
    console.log(`FAIL  ${persona.padEnd(16)} ${allowed ? 'CAN   ' : 'CANNOT'} ${label}`)
    console.log(`      ${String(e.message || e).split('\n')[0]}`)
  }
}

const CASES = [
  ['read products', () => true, (db) => getDoc(doc(db, 'products', 'p1'))],
  ['write products', (p) => STAFF.has(p), (db) => setDoc(doc(db, 'products', 'p2'), { name: 'Sugar', price: 3, category: 'Sugar' })],
  ['read categories', () => true, (db) => getDoc(doc(db, 'categories', 'c1'))],
  ['write categories', (p) => STAFF.has(p), (db) => setDoc(doc(db, 'categories', 'c2'), { name: 'Tools' })],
  ['read settings', () => true, (db) => getDoc(doc(db, 'settings', 'shop'))],
  ['write settings', (p) => STAFF.has(p), (db) => updateDoc(doc(db, 'settings', 'shop'), { shopOpensAt: '7:00 AM' })],
  ['read an order', (p) => STAFF.has(p), (db) => getDoc(doc(db, 'orders', 'SBH-1'))],
  ['list orders', (p) => STAFF.has(p), (db) => getDocs(collection(db, 'orders'))],
  ['update an order', (p) => STAFF.has(p), (db) => updateDoc(doc(db, 'orders', 'SBH-1'), { status: 'confirmed' })],
  ['create an order', () => false, (db) => setDoc(doc(db, 'orders', 'SBH-9'), { status: 'new' })],
  ['delete an order', () => false, (db) => deleteDoc(doc(db, 'orders', 'SBH-1'))],
  ['get OWN admins doc', (p) => p !== 'signed-out', (db, p) => getDoc(doc(db, 'admins', uidOf[p] ?? 'x'))],
  ["get ANOTHER user's admins doc", () => false, (db, p) => getDoc(doc(db, 'admins', p === 'admin' ? 'sim' : 'kin'))],
  ['list admins', () => false, (db) => getDocs(collection(db, 'admins'))],
  ['write own admins doc (self-promote)', () => false, (db, p) => setDoc(doc(db, 'admins', uidOf[p] ?? 'x'), { role: 'admin' })],
  ['create an admins doc for someone', () => false, (db) => setDoc(doc(db, 'admins', 'newbie'), { role: 'owner' })],
  ['read auditLog', (p) => STAFF.has(p), (db) => getDocs(collection(db, 'auditLog'))],
  ['write auditLog', () => false, (db) => addDoc(collection(db, 'auditLog'), { action: 'forged' })],
  ['edit an auditLog entry', () => false, (db) => updateDoc(doc(db, 'auditLog', 'a1'), { action: 'edited' })],
  ['read counters', () => false, (db) => getDoc(doc(db, 'counters', 'orders'))],
  ['read rateLimits', () => false, (db) => getDoc(doc(db, 'rateLimits', 'global'))],
  ['write rateLimits', () => false, (db) => setDoc(doc(db, 'rateLimits', 'global'), { count: 0 })],
  ["read someone else's cart", (p) => p === 'customer', (db) => getDoc(doc(db, 'carts', 'cust'))],
]

for (const [label, allowedFor, run] of CASES) {
  for (const [persona, db] of Object.entries(PERSONAS)) {
    await expect(persona, label, allowedFor(persona), () => run(db, persona))
  }
}

console.log(`Role matrix: ${CASES.length} operations x ${Object.keys(PERSONAS).length} personas`)
console.log(`${passed} passed, ${failed} failed`)
await testEnv.cleanup()
process.exit(failed > 0 ? 1 : 0)
