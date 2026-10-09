// Rules for the SBH Inventory iPad app (sbh-inventory repo), per role:
// public, customer, website admin without a claim, and the custom-claim
// roles staff / owner / admin. Writes mirror what the iPad's StockWriter
// sends (one WriteBatch per stock operation).
//
// Run with: firebase emulators:exec --only firestore "node scripts/firestore-rules-inventory.test.mjs"
import { readFileSync } from 'fs'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, writeBatch, increment, serverTimestamp } from 'firebase/firestore'

const testEnv = await initializeTestEnvironment({
  projectId: 'demo-sbh-rules-inventory',
  firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
})

await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore()
  await setDoc(doc(db, 'admins', 'webadmin'), { role: 'admin' })
  await setDoc(doc(db, 'products', 'p1'), { name: 'AP flour 25kg', price: 50, category: 'Flours and Grains', code: 'F00010' })
  await setDoc(doc(db, 'productCosts', 'p1'), { costPerUnitSen: 5000 })
  await setDoc(doc(db, 'batches', 'b1'), { productId: 'p1', locationId: 'storeroom', qtyMilli: 2000 })
  await setDoc(doc(db, 'batchCosts', 'b1'), { productId: 'p1', unitCostSen: 5000 })
  await setDoc(doc(db, 'stockLevels', 'p1_storeroom'), { productId: 'p1', locationId: 'storeroom', onHandMilli: 2000, reservedMilli: 0 })
  await setDoc(doc(db, 'stockMovements', 'm1'), { type: 'receive', productId: 'p1', locationId: 'storeroom', qtyDeltaMilli: 2000, reservedDeltaMilli: 0, userId: 'sim' })
  await setDoc(doc(db, 'repacks', 'r1'), { userId: 'sim', sourceProductId: 'p1' })
  await setDoc(doc(db, 'transfers', 't1'), { userId: 'sim' })
  await setDoc(doc(db, 'receipts', 'rc1'), { userId: 'sim' })
  await setDoc(doc(db, 'invSettings', 'app'), { dailyCountSize: 20 })
  await setDoc(doc(db, 'invSettings', 'ownership'), { categories: {} })
  await setDoc(doc(db, 'publicCatalog', 'p1'), { code: 'F00010', availability: 'in_stock' })
  await setDoc(doc(db, 'codeBlocks', 'F'), { nextNumber: 51 })
  await setDoc(doc(db, 'needsAttention', 'n1'), { kind: 'drift', resolved: false })
  await setDoc(doc(db, 'orders', 'SBH-1'), { status: 'new', items: [] })
  await setDoc(doc(db, 'auditLog', 'a1'), { action: 'price' })
  await setDoc(doc(db, 'locations', 'storeroom'), { name: 'Storeroom' })
  await setDoc(doc(db, 'shelfLifeTemplates', 'flour'), { name: 'Flour', durationValue: 3, durationUnit: 'month' })
})

const ctx = (uid, role) =>
  uid === null ? testEnv.unauthenticatedContext().firestore() : testEnv.authenticatedContext(uid, role ? { role } : {}).firestore()
const PERSONAS = {
  public: { db: ctx(null), uid: null },
  customer: { db: ctx('cust'), uid: 'cust' },
  'web admin (no claim)': { db: ctx('webadmin'), uid: 'webadmin' },
  staff: { db: ctx('aunt', 'staff'), uid: 'aunt' },
  owner: { db: ctx('sim', 'owner'), uid: 'sim' },
  admin: { db: ctx('kin', 'admin'), uid: 'kin' },
}
const INV = new Set(['staff', 'owner', 'admin'])
const OWNER = new Set(['owner', 'admin'])
const WEB_OR_OWNER = new Set(['web admin (no claim)', 'owner', 'admin'])

let n = 0
const id = () => `x${++n}`
const movement = (uid, extra = {}) => ({
  type: 'receive', productId: 'p1', locationId: 'storeroom', batchId: null, qtyDeltaMilli: 1000, reservedDeltaMilli: 0,
  refType: 'receipt', refId: 'rc', userId: uid ?? 'nobody', deviceId: 'ipad-1', clientTime: new Date(), serverTime: serverTimestamp(), ...extra,
})

/** What the iPad sends for "receive 1 bag": parent + ledger + new batch + level increment. */
function receiveBatch(db, uid) {
  const b = writeBatch(db)
  const bid = id()
  b.set(doc(db, 'receipts', id()), { userId: uid ?? 'nobody', lines: [] })
  b.set(doc(db, 'stockMovements', id()), movement(uid, { batchId: bid }))
  b.set(doc(db, 'batches', bid), { productId: 'p1', locationId: 'storeroom', qtyMilli: 1000, receivedDate: '2026-10-09', expiryDate: null })
  b.set(doc(db, 'stockLevels', 'p1_storeroom'), { productId: 'p1', locationId: 'storeroom', onHandMilli: increment(1000), reservedMilli: increment(0), updatedAt: serverTimestamp() }, { merge: true })
  return b.commit()
}

/** Repack-style: decrement an existing batch + level, new batch for packs. */
function repackBatch(db, uid) {
  const b = writeBatch(db)
  const nb = id()
  b.set(doc(db, 'repacks', id()), { userId: uid ?? 'nobody', sourceProductId: 'p1' })
  b.set(doc(db, 'stockMovements', id()), movement(uid, { type: 'repack_out', batchId: 'b1', qtyDeltaMilli: -1000 }))
  b.set(doc(db, 'stockMovements', id()), movement(uid, { type: 'repack_in', productId: 'p2', batchId: nb, qtyDeltaMilli: 25000 }))
  b.set(doc(db, 'batches', 'b1'), { qtyMilli: increment(-1000), updatedAt: serverTimestamp() }, { merge: true })
  b.set(doc(db, 'batches', nb), { productId: 'p2', locationId: 'storeroom', qtyMilli: 25000, expiryDate: '2027-01-09', expirySource: 'inherited', sourceBatchId: 'b1' })
  b.set(doc(db, 'stockLevels', 'p1_storeroom'), { productId: 'p1', locationId: 'storeroom', onHandMilli: increment(-1000), reservedMilli: increment(0) }, { merge: true })
  b.set(doc(db, 'stockLevels', 'p2_storeroom'), { productId: 'p2', locationId: 'storeroom', onHandMilli: increment(25000), reservedMilli: increment(0) }, { merge: true })
  return b.commit()
}

const CASES = [
  // catalog
  ['read products', () => true, (db) => getDoc(doc(db, 'products', 'p1'))],
  ['edit a product (name, price)', (p) => WEB_OR_OWNER.has(p), (db) => updateDoc(doc(db, 'products', 'p1'), { name: `AP flour ${id()}`, sellPrice: 5200 + n, price: 52 })],
  ['create a product', (p) => WEB_OR_OWNER.has(p), (db) => setDoc(doc(db, 'products', id()), { name: 'Bread flour', category: 'Flours and Grains', code: 'F00003', sellPrice: 600, price: 6 })],
  ['staff stamps an opening count on a product', (p) => INV.has(p) || p === 'web admin (no claim)', (db) => updateDoc(doc(db, 'products', 'p1'), { openingCount: { done: true }, lastCountedAt: new Date() })],
  ['staff changes a price', (p) => WEB_OR_OWNER.has(p), (db) => updateDoc(doc(db, 'products', 'p1'), { sellPrice: ++n })],
  ['write a category', (p) => WEB_OR_OWNER.has(p), (db) => setDoc(doc(db, 'categories', id()), { name: 'Tools', codePrefix: 'T' })],
  ['read productCosts', (p) => OWNER.has(p), (db) => getDoc(doc(db, 'productCosts', 'p1'))],
  ['write productCosts', (p) => OWNER.has(p), (db) => setDoc(doc(db, 'productCosts', 'p1'), { costPerUnitSen: 5100 })],
  ['read shelfLifeTemplates', (p) => INV.has(p), (db) => getDoc(doc(db, 'shelfLifeTemplates', 'flour'))],
  ['write shelfLifeTemplates', (p) => OWNER.has(p), (db) => setDoc(doc(db, 'shelfLifeTemplates', 'premix'), { name: 'Premix', durationValue: 5, durationUnit: 'month' })],
  ['read locations', (p) => INV.has(p), (db) => getDoc(doc(db, 'locations', 'storeroom'))],
  ['write locations', (p) => p === 'admin', (db) => setDoc(doc(db, 'locations', 'shop'), { name: 'Shop' })],
  ['read invSettings', (p) => INV.has(p), (db) => getDoc(doc(db, 'invSettings', 'app'))],
  ['write invSettings/app', (p) => OWNER.has(p), (db) => setDoc(doc(db, 'invSettings', 'app'), { dailyCountSize: 25 }, { merge: true })],
  ['write invSettings/ownership', (p) => p === 'admin', (db) => setDoc(doc(db, 'invSettings', 'ownership'), { categories: { c: { shop: 'new' } } })],
  // stock batches as the iPad sends them
  ['receive (one batch: parent + ledger + batch + level)', (p) => INV.has(p), (db, uid) => receiveBatch(db, uid)],
  ['repack (decrement + new batch + two levels)', (p) => INV.has(p), (db, uid) => repackBatch(db, uid)],
  ['ledger entry in someone else\'s name', () => false, (db) => setDoc(doc(db, 'stockMovements', id()), movement('someone-else'))],
  ['ledger entry with a decimal quantity', () => false, (db, uid) => setDoc(doc(db, 'stockMovements', id()), movement(uid, { qtyDeltaMilli: 0.5 }))],
  ['ledger entry with an unknown type', () => false, (db, uid) => setDoc(doc(db, 'stockMovements', id()), movement(uid, { type: 'sale_pos' }))],
  ['online_reserve entry', (p) => OWNER.has(p), (db, uid) => setDoc(doc(db, 'stockMovements', id()), movement(uid, { type: 'online_reserve', qtyDeltaMilli: 0, reservedDeltaMilli: 1000 }))],
  ['read the ledger', (p) => INV.has(p), (db) => getDocs(collection(db, 'stockMovements'))],
  ['edit a ledger entry', () => false, (db) => updateDoc(doc(db, 'stockMovements', 'm1'), { qtyDeltaMilli: 99000 })],
  ['delete a ledger entry', () => false, (db) => deleteDoc(doc(db, 'stockMovements', 'm1'))],
  ['re-send an existing ledger id (retry never duplicates)', () => false, (db, uid) => setDoc(doc(db, 'stockMovements', 'm1'), movement(uid))],
  ['read batches', (p) => INV.has(p), (db) => getDoc(doc(db, 'batches', 'b1'))],
  ['change a batch\'s expiry', () => false, (db) => updateDoc(doc(db, 'batches', 'b1'), { expiryDate: '2030-01-01' })],
  ['put a cost on a batch', () => false, (db) => setDoc(doc(db, 'batches', id()), { productId: 'p1', locationId: 'storeroom', qtyMilli: 1, unitCostSen: 1 })],
  ['delete a batch', () => false, (db) => deleteDoc(doc(db, 'batches', 'b1'))],
  ['read batchCosts', (p) => OWNER.has(p), (db) => getDoc(doc(db, 'batchCosts', 'b1'))],
  ['create batchCosts', (p) => OWNER.has(p), (db) => setDoc(doc(db, 'batchCosts', id()), { productId: 'p1', unitCostSen: 208 })],
  ['edit batchCosts', () => false, (db) => updateDoc(doc(db, 'batchCosts', 'b1'), { unitCostSen: 1 })],
  ['set stockLevels to a number (not an increment-shaped write)', (p) => INV.has(p), (db) => setDoc(doc(db, 'stockLevels', 'p1_storeroom'), { onHandMilli: 5 }, { merge: true })],
  ['write a level under the wrong id', () => false, (db) => setDoc(doc(db, 'stockLevels', 'p9_storeroom'), { productId: 'p1', locationId: 'storeroom', onHandMilli: 1, reservedMilli: 0 })],
  ['write negativeFlag on a level', () => false, (db) => setDoc(doc(db, 'stockLevels', 'p1_storeroom'), { negativeFlag: false }, { merge: true })],
  ['delete a level', () => false, (db) => deleteDoc(doc(db, 'stockLevels', 'p1_storeroom'))],
  ['mark a repack undone', (p) => INV.has(p), (db, uid) => updateDoc(doc(db, 'repacks', 'r1'), { undone: true, undoneAt: new Date(), undoneBy: uid })],
  ['edit a repack', () => false, (db) => updateDoc(doc(db, 'repacks', 'r1'), { sourceProductId: 'p9' })],
  ['delete a repack', () => false, (db) => deleteDoc(doc(db, 'repacks', 'r1'))],
  ['delete a transfer', () => false, (db) => deleteDoc(doc(db, 'transfers', 't1'))],
  ['write a stock take', (p) => INV.has(p), (db) => setDoc(doc(db, 'stockTakes', id()), { mode: 'daily', status: 'open' })],
  ['write today\'s count list', (p) => INV.has(p), (db) => setDoc(doc(db, 'dailyCountLists', '2026-10-09'), { items: [] })],
  ['touch codeBlocks', () => false, (db) => setDoc(doc(db, 'codeBlocks', 'F'), { nextNumber: 1 })],
  ['read codeBlocks', () => false, (db) => getDoc(doc(db, 'codeBlocks', 'F'))],
  ['read publicCatalog', () => true, (db) => getDoc(doc(db, 'publicCatalog', 'p1'))],
  ['write publicCatalog', () => false, (db) => setDoc(doc(db, 'publicCatalog', 'p1'), { availability: 'in_stock' })],
  ['resolve a needsAttention item', (p) => INV.has(p), (db, uid) => updateDoc(doc(db, 'needsAttention', 'n1'), { resolved: true, resolvedBy: uid, resolvedAt: new Date() })],
  ['rewrite a needsAttention item', () => false, (db) => updateDoc(doc(db, 'needsAttention', 'n1'), { kind: 'other' })],
  // orders: the iPad owner moves them; staff cannot (prompt §4)
  ['read orders', (p) => WEB_OR_OWNER.has(p), (db) => getDoc(doc(db, 'orders', 'SBH-1'))],
  ['confirm an order with an inventory hold', (p) => WEB_OR_OWNER.has(p), (db) => updateDoc(doc(db, 'orders', 'SBH-1'), { status: 'confirmed', inv: { state: 'reserved', lines: [] } })],
  // audit log
  ['iPad writes an audit entry', (p) => OWNER.has(p), (db, uid) => setDoc(doc(db, 'auditLog', id()), { action: 'price', by: uid, source: 'ipad' })],
  ['audit entry in someone else\'s name', () => false, (db) => setDoc(doc(db, 'auditLog', id()), { action: 'price', by: 'x', source: 'ipad' })],
  ['read auditLog', (p) => p === 'admin' || p === 'web admin (no claim)', (db) => getDocs(collection(db, 'auditLog'))],
  ['edit an audit entry', () => false, (db) => updateDoc(doc(db, 'auditLog', 'a1'), { action: 'x' })],
]

let passed = 0
let failed = 0
for (const [label, allowedFor, run] of CASES) {
  for (const [persona, { db, uid }] of Object.entries(PERSONAS)) {
    const allowed = allowedFor(persona)
    try {
      await (allowed ? assertSucceeds(run(db, uid)) : assertFails(run(db, uid)))
      passed++
    } catch (e) {
      failed++
      console.log(`FAIL  ${persona.padEnd(22)} ${allowed ? 'CAN   ' : 'CANNOT'} ${label}`)
      console.log(`      ${String(e.message || e).split('\n')[0]}`)
    }
  }
}
console.log(`Inventory rules: ${CASES.length} operations x ${Object.keys(PERSONAS).length} personas`)
console.log(`${passed} passed, ${failed} failed`)
await testEnv.cleanup()
process.exit(failed > 0 ? 1 : 0)
