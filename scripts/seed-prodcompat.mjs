// Production as it is TODAY (2026-10-17), for scripts/prod-compat.test.mjs:
// - Firestore rules = the live production ruleset (380fd412, fetched
//   read-only; scripts/fixtures/production-firestore.rules), loaded into
//   the emulator, so the new collections are NOT readable by browsers;
// - no Cloud Functions: publicCatalog and invSettings do not exist;
// - products, categories and settings only in their current (legacy)
//   shape: no code, nameZh, collections, chilled, status or sell units.
// Emulator only (run via PRE_BUILD in scripts/test-env.sh), never production.
import { readFileSync } from 'fs'
import { db, resetEmulators } from './lib/emu.mjs'

const PROJECT = process.env.GCLOUD_PROJECT || 'demo-sbh-test'
const FS = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080'

await resetEmulators()
const rules = readFileSync(new URL('./fixtures/production-firestore.rules', import.meta.url), 'utf8')
const res = await fetch(`http://${FS}/emulator/v1/projects/${PROJECT}:securityRules`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ rules: { files: [{ name: 'firestore.rules', content: rules }] } }),
})
if (!res.ok) throw new Error(`could not load production rules: ${res.status} ${await res.text()}`)

const d = db()
// The three ids the home page's Best sellers section asks for.
const BEST = ['k7KIV3aYXZG33EDmEqJg', '3pTEcScO5E9hombgGEmL', '1KAQVQF1g9ZnJhslJ2Wd']
const legacy = [
  [BEST[0], 'Butter cake premix 500g', 12.9, 'Premix', true, true],
  [BEST[1], 'Bread flour 1kg', 5.2, 'Flour', true, true],
  [BEST[2], 'Cocoa powder 500g', 16.9, 'Baking', true, false],
  ['legacy-ap', 'All-purpose flour 1kg', 4.5, 'Flour', true, false],
  ['legacy-tin', 'Round cake tin 8 inch', 25, 'Tools', false, false], // out of stock (old switch)
  ['legacy-ask', 'Fondant (custom colour)', undefined, 'Decorations', true, false], // Ask for price
]
for (const [id, name, price, category, inStock, featured] of legacy) {
  await d.collection('products').doc(id).set({
    name, category, inStock, featured, description: `${name}.`, imageUrl: '/images/placeholder-product.jpg',
    ...(price === undefined ? {} : { price }),
  })
}
await d.collection('products').doc('legacy-hidden').set({ name: 'Old hidden item', price: 3, category: 'Flour', isActive: false, inStock: true })
await d.collection('products').doc('legacy-deleted').set({ name: 'Old deleted item', price: 3, category: 'Flour', isDeleted: true, inStock: true })
for (const [i, name] of ['Flour', 'Premix', 'Baking', 'Tools', 'Decorations'].entries()) {
  await d.collection('categories').doc(name.toLowerCase()).set({ name, order: i })
}
await d.collection('settings').doc('shop').set({
  shopOpensAt: '6:30 AM', shopClosesAt: '1:00 PM', openingHours: 'Daily: 6:30 AM - 1:00 PM', whatsappNumber: '60123456789', duitNowQrPath: null,
})
console.log('Seeded production-shaped data + production rules (no publicCatalog, no invSettings, no functions)')
process.exit(0)
