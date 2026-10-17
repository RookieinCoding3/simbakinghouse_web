// Seeds the shop catalogue for scripts/shop-stock.test.mjs BEFORE the test
// build, because /products is ISR: it's rendered at build time and cached
// for 5 minutes, so products added after the build wouldn't show. Run via
// PRE_BUILD in scripts/test-env.sh (emulator env vars set, never production).
import { db, resetEmulators } from './lib/emu.mjs'

await resetEmulators()
const d = db()
const unit = (id, label, factorMilli, priceSen, channel = 'both') => ({ id, label, factorMilli, priceSen, channel })

const managed = {
  'shop-rice': {
    product: { name: 'Rice flour', category: 'Flour', baseUnit: 'kg', lowStockThresholdMilli: 3000, sellUnits: [unit('kg1', '1 kg', 1000, 650), unit('g500', '500 g pack', 500, 350)], hasWholesale: true, price: 6.5, stockStatus: 'in_stock' },
    wholesale: [unit('bag25', '25 kg bag', 25000, 13000, 'wholesale')],
    onHandMilli: 12000,
  },
  'shop-butter': {
    product: { name: 'Butter 250g', category: 'Dairy', baseUnit: 'pc', lowStockThresholdMilli: 3000, sellUnits: [unit('pc', '1 block', 1000, 1290)], hasWholesale: false, price: 12.9, stockStatus: 'low' },
    onHandMilli: 2000,
  },
  'shop-fondant': {
    product: { name: 'Fondant custom colour', category: 'Decorations', baseUnit: 'kg', lowStockThresholdMilli: 1000, sellUnits: [unit('kg1', '1 kg', 1000, null)], hasWholesale: false, stockStatus: 'out' },
    onHandMilli: 0,
  },
}
for (const [id, m] of Object.entries(managed)) {
  await d.collection('products').doc(id).set({ ...m.product, inStock: true, featured: false, trackExpiry: false, barcodes: [], managedStock: true, imageUrl: '/images/placeholder-product.jpg', description: 'Seeded for the shop test.' })
  await d.collection('inventory').doc(id).set({ productId: id, onHandMilli: m.onHandMilli, reservedMilli: 0, lastCountedAt: Date.now() })
  await d.collection('productPrivate').doc(id).set({ wholesaleUnits: m.wholesale ?? [] })
}
// Old products, exactly as they exist today (no sellUnits, not managed).
await d.collection('products').doc('shop-tin').set({ name: 'Old cake tin', price: 18, category: 'Tools', inStock: false, description: 'Old.' })
await d.collection('products').doc('shop-topper').set({ name: 'Cake topper custom', category: 'Decorations', inStock: true, description: 'Ask us.' })
await d.collection('products').doc('shop-cocoa').set({ name: 'Cocoa powder', price: 9.9, category: 'Baking', inStock: true, description: 'Dutch.' })

// Quick-added on the iPad, details not filled in yet: must never show.
await d.collection('products').doc('shop-draft').set({ name: 'Draft secret item', code: 'SHELF-DRAFT', category: '', status: 'draft', isActive: false, sellPrice: 450, price: 4.5, inStock: true, description: '' })

// Storefront (scripts/storefront.test.mjs): Chinese names, codes,
// collections (first-time, bundles; "regulars" left empty so it must be
// hidden), one chilled product, and shop settings with the language line on.
const store = {
  'shop-rice': { nameZh: '米粉', code: 'F00011', collections: ['first-time'] },
  'shop-cocoa': { nameZh: '可可粉', code: 'B00003', collections: ['first-time', 'bundles'] },
  'shop-butter': { nameZh: '牛油 250克', code: 'D00009', collections: ['bundles'], chilled: true },
}
for (const [id, f] of Object.entries(store)) await d.collection('products').doc(id).set(f, { merge: true })
await d.collection('settings').doc('shop').set({
  shopOpensAt: '6:30 AM',
  shopClosesAt: '1:00 PM',
  openingHours: 'Daily: 6:30 AM - 1:00 PM',
  whatsappNumber: '60123456789',
  chilledNoticeEn: 'TEST chilled notice: keep it cold.',
  chilledNoticeZh: '测试冷藏提示：请保持冰冷。',
  showLanguageLine: true,
})

console.log('Seeded shop catalogue (3 managed, 3 old, 1 draft) + storefront fields and settings')
process.exit(0)
