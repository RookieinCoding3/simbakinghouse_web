// Seeds exactly one real product into the Firestore emulator so
// scripts/order-abuse.test.mjs has a genuine productId/price to order
// against, and a known-fake id to prove is rejected. Run only against the
// emulator (FIRESTORE_EMULATOR_HOST must be set) — see
// scripts/run-order-abuse-tests.sh, which always sets it first.
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('Refusing to seed: FIRESTORE_EMULATOR_HOST is not set (would write to a real project)')
}

const app = initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID })
const db = getFirestore(app)

await db.collection('products').doc('test-flour-1kg').set({
  name: 'Test Flour 1kg',
  price: 12.5,
  category: 'flour',
  inStock: true,
})

console.log('Seeded products/test-flour-1kg (price RM12.50)')
process.exit(0)
