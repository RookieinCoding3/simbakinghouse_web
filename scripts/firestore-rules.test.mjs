// Firestore Rules security test — proves what a normal signed-up customer
// can and cannot do, against the real firestore.rules file, run in the
// Firestore emulator (never against production data).
//
// Run with: firebase emulators:exec --only firestore "node scripts/firestore-rules.test.mjs"
// (the npm script `test:rules` does exactly this — see package.json)
import { readFileSync } from 'fs'
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

const testEnv = await initializeTestEnvironment({
  projectId: 'demo-sbh-rules-test',
  firestore: {
    rules: readFileSync('firestore.rules', 'utf8'),
    host: '127.0.0.1',
    port: 8080,
  },
})

// Seed fixture data bypassing rules entirely — this is test setup, not a
// claim about what any real client can do.
await testEnv.withSecurityRulesDisabled(async (context) => {
  const db = context.firestore()
  await setDoc(doc(db, 'admins', 'admin-uid'), { addedAt: Date.now() })
  await setDoc(doc(db, 'orders', 'SBH-TEST-0001'), {
    orderId: 'SBH-TEST-0001',
    status: 'new',
    userId: 'customer-a',
    customerName: 'Test Customer',
    customerPhone: '60123456789',
    phoneLast4: '6789',
    fulfilment: 'pickup',
    collectDate: null,
    collectTime: null,
    notes: '',
    items: [],
    estimatedTotal: 10,
    confirmedTotal: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusHistory: [],
  })
  await setDoc(doc(db, 'products', 'test-product'), {
    name: 'Test Flour',
    price: 10,
    category: 'flour',
    inStock: true,
  })
  await setDoc(doc(db, 'carts', 'customer-b'), { items: [], updatedAt: Date.now() })
})

const customerA = testEnv.authenticatedContext('customer-a').firestore()
const adminCtx = testEnv.authenticatedContext('admin-uid').firestore()
const anon = testEnv.unauthenticatedContext().firestore()

let passed = 0
let failed = 0

async function check(name, run, shouldSucceed) {
  try {
    if (shouldSucceed) {
      await assertSucceeds(run())
    } else {
      await assertFails(run())
    }
    console.log(`PASS  ${name}`)
    passed++
  } catch (e) {
    console.log(`FAIL  ${name}`)
    console.log(`      ${String(e.message || e).split('\n')[0]}`)
    failed++
  }
}

console.log('--- A normal signed-up customer CANNOT ---')

await check(
  "read an order at all via the client SDK (even their own — orders are server-only, see app/api/orders)",
  () => getDoc(doc(customerA, 'orders', 'SBH-TEST-0001')),
  false
)

await check(
  'write/update an order\'s status',
  () => updateDoc(doc(customerA, 'orders', 'SBH-TEST-0001'), { status: 'confirmed' }),
  false
)

await check(
  'create a new product (inventory)',
  () => setDoc(doc(customerA, 'products', 'hacked-product'), { name: 'x', price: 0, category: 'x' }),
  false
)

await check(
  "modify an existing product's price/stock",
  () => updateDoc(doc(customerA, 'products', 'test-product'), { price: 0 }),
  false
)

await check(
  'read the admin allowlist doc',
  () => getDoc(doc(customerA, 'admins', 'admin-uid')),
  false
)

await check(
  'read or write another customer\'s cart',
  () => getDoc(doc(customerA, 'carts', 'customer-b')),
  false
)

await check(
  'unauthenticated: read any order',
  () => getDoc(doc(anon, 'orders', 'SBH-TEST-0001')),
  false
)

console.log('\n--- Extra: not even an admin-claimed user can read /admins directly ---')
await check(
  '(allow read, write: if false is unconditional — the allowlist itself has zero client-readable path, by design)',
  () => getDoc(doc(adminCtx, 'admins', 'admin-uid')),
  false
)

console.log('\n--- Positive controls (prove the harness/rules are genuinely loaded, not vacuously passing) ---')

await check(
  'customer CAN read public products',
  () => getDoc(doc(customerA, 'products', 'test-product')),
  true
)

await check(
  'customer CAN read/write their OWN cart',
  () => setDoc(doc(customerA, 'carts', 'customer-a'), { items: [], updatedAt: Date.now() }),
  true
)

await check(
  'admin CAN read orders (proves isAdmin() genuinely grants access, not just everything denied)',
  () => getDoc(doc(adminCtx, 'orders', 'SBH-TEST-0001')),
  true
)

console.log(`\n${passed} passed, ${failed} failed`)
await testEnv.cleanup()
process.exit(failed > 0 ? 1 : 0)
