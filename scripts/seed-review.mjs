// Realistic-looking DEMO catalogue for the customer review (emulator only,
// never production): used by the first-time-customer review agent via
//   PRE_BUILD='node scripts/seed-review.mjs' bash scripts/test-env.sh <cmd>
// Product facts here are invented demo data, not the shop's real catalogue.
import { db, resetEmulators } from './lib/emu.mjs'

await resetEmulators()
const d = db()
const unit = (id, label, priceSen) => ({ id, label, factorMilli: 1000, priceSen, channel: 'both' })
const products = [
  ['p-ap', 'All-purpose flour 1kg', '中筋面粉 1公斤', 'F00002', 'Flour', 450, 'For cakes, cookies and everyday baking.', ['first-time']],
  ['p-bread', 'Bread flour 1kg', '高筋面粉 1公斤', 'F00003', 'Flour', 520, 'High protein flour for soft bread and buns.', ['regulars']],
  ['p-cake', 'Cake flour 1kg', '低筋面粉 1公斤', 'F00004', 'Flour', 560, 'Low protein flour for light sponge cakes.', ['bundles']],
  ['p-butter-premix', 'Butter cake premix 500g', '牛油蛋糕预拌粉 500克', 'P00001', 'Premix', 1290, 'Add eggs, butter and water. Easy for first-timers.', ['first-time', 'bundles']],
  ['p-choc-premix', 'Chocolate cake premix 500g', '巧克力蛋糕预拌粉 500克', 'P00002', 'Premix', 1390, 'Moist chocolate cake in one bowl.', ['first-time']],
  ['p-sugar', 'Caster sugar 1kg', '细砂糖 1公斤', 'S00001', 'Sugar', 480, 'Fine sugar that dissolves fast.', ['bundles', 'regulars']],
  ['p-cream', 'Whipping cream 1L', '淡奶油 1升', 'D00002', 'Dairy', 2190, 'For frosting and desserts.', ['bundles'], true],
  ['p-cheese', 'Cream cheese 250g', '奶油奶酪 250克', 'D00003', 'Dairy', 1150, 'For cheesecake and frosting.', [], true],
  ['p-yeast', 'Instant yeast 500g', '即发酵母 500克', 'Y00001', 'Baking', 1590, 'For bread and pau.', ['regulars']],
  ['p-tin', 'Round cake tin 8 inch', '8寸圆形蛋糕模', 'T00001', 'Tools', 2500, 'Non-stick, removable base.', ['first-time']],
  ['p-whisk', 'Balloon whisk', '打蛋器', 'T00002', 'Tools', 900, 'Stainless steel.', []],
  ['p-cocoa', 'Cocoa powder 500g', '可可粉 500克', 'B00003', 'Baking', 1690, 'Dutch-process cocoa.', ['bundles']],
]
for (const [id, name, nameZh, code, category, price, description, collections, chilled] of products) {
  await d.collection('products').doc(id).set({
    name, nameZh, code, category, description, collections, chilled: chilled === true,
    price: price / 100, sellUnits: [unit('u1', '1 pc', price)], inStock: true, featured: id === 'p-butter-premix',
    imageUrl: '/images/placeholder-product.jpg', status: 'active',
  })
}
await d.collection('settings').doc('shop').set({
  shopOpensAt: '6:30 AM', shopClosesAt: '1:00 PM', openingHours: 'Daily: 6:30 AM - 1:00 PM', whatsappNumber: '60123456789',
})
console.log(`Seeded review catalogue (${products.length} demo products)`)
process.exit(0)
