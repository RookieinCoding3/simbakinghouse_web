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

// "Ask for price": no price field at all. Orderable; priced later by the owner.
await db.collection('products').doc('test-ask-price').set({
  name: 'Test Wedding Cake Topper',
  category: 'tools',
  inStock: true,
})
// Must still be rejected.
await db.collection('products').doc('test-deleted').set({ name: 'Deleted', price: 3, isDeleted: true })
await db.collection('products').doc('test-inactive').set({ name: 'Inactive', isActive: false })

console.log('Seeded products/test-flour-1kg (RM12.50), test-ask-price (no price), test-deleted, test-inactive')
process.exit(0)
