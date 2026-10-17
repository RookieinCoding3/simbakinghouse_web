// Every Phase 2 admin screen in a real browser (WebKit) against the emulator:
// the stock flows at phone size, then every screen at 390 px and 1440 px for
// layout (no sideways scroll, nothing cut off), page errors, and screenshots
// (saved to SHOTS_DIR, default .screenshots/phase2). Run inside test-env.sh.
import { mkdirSync } from 'fs'
import { webkit } from 'playwright'
import { BASE_URL, db, resetEmulators, createAdmin, check, assert, summary } from './lib/emu.mjs'
import { apiAs, createProduct, switchOn, placeOrders, loginAdmin, waitForDoc, getDoc, opId, sleep, isCancelledRequestNoise } from './lib/phase2.mjs'

const SHOTS = process.env.SHOTS_DIR || '.screenshots/phase2'
mkdirSync(SHOTS, { recursive: true })

await resetEmulators()
const sim = await createAdmin('sim@sbh.test', 'owner')
const api = apiAs(sim.email)

// --- seed: a small shop mid switch-over ---
const legacy = {
  tin: { name: 'Cake tin 8in', price: 18, category: 'Tools', inStock: true },
  whisk: { name: 'Balloon whisk', price: 12.9, category: 'Tools', inStock: true },
  cocoa: { name: 'Cocoa powder 500g', price: 9.9, category: 'Baking', inStock: true },
  sprinkles: { name: 'Rainbow sprinkles', category: 'Baking', inStock: true },
}
for (const [id, d] of Object.entries(legacy)) await db().collection('products').doc(id).set(d)
const rice = await createProduct(api, {
  name: 'Rice flour', category: 'Flour', baseUnit: 'kg', lowStockThresholdMilli: 3000, trackExpiry: false, barcodes: ['9555000000017'],
  sellUnits: [
    { id: 'kg1', label: '1 kg', factorMilli: 1000, priceSen: 650, channel: 'both' },
    { id: 'g500', label: '500 g pack', factorMilli: 500, priceSen: 350, channel: 'both' },
    { id: 'bag25', label: '25 kg bag', factorMilli: 25000, priceSen: 13000, channel: 'wholesale' },
  ],
})
const butter = await createProduct(api, {
  name: 'Butter 250g', category: 'Dairy', baseUnit: 'pc', lowStockThresholdMilli: 3000, trackExpiry: true, barcodes: [],
  sellUnits: [{ id: 'pc', label: '1 block', factorMilli: 1000, priceSen: 1290, channel: 'both' }],
})
const fondant = await createProduct(api, {
  name: 'Fondant (custom colour)', category: 'Decorations', baseUnit: 'kg', lowStockThresholdMilli: 1000, trackExpiry: false, barcodes: [],
  sellUnits: [{ id: 'kg1', label: '1 kg', factorMilli: 1000, priceSen: null, channel: 'both' }],
})
await switchOn(api, rice, 10000)
await switchOn(api, butter, 0)
await switchOn(api, fondant, 0)
await api('POST', '/api/admin/stock/adjust', { opId: opId(), productId: rice, reason: 'restock', qtyMilli: 5000, note: 'supplier delivery' })
await api('POST', '/api/admin/stock/adjust', { opId: opId(), productId: rice, reason: 'damaged', qtyMilli: 1000, note: 'torn bag' })
await api('POST', '/api/admin/stock/adjust', { opId: opId(), productId: butter, reason: 'restock', qtyMilli: 2000, expiryDate: '2026-12-01' })
const [held] = await placeOrders([[{ productId: rice, sellUnitId: 'kg1', qty: 2 }, { productId: 'sprinkles', qty: 1 }]])
assert(held.status === 201, `order ${held.status} ${held.json.error}`)
await api('POST', `/api/admin/orders/${held.json.orderId}/transition`, { to: 'confirmed', confirmedTotalSen: 2000 })
// rice: 10 + 5 - 1 = 14 kg on hand, 2 kg held. butter: 2 (low). fondant: 0 (out).

const browser = await webkit.launch()
const pageErrors = []
async function newPage(width) {
  const ctx = await browser.newContext(
    width < 800 ? { viewport: { width, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width, height: 900 } }
  )
  const page = await ctx.newPage()
  page.on('pageerror', (e) => {
    if (!isCancelledRequestNoise(e.message)) pageErrors.push(`${width}px ${page.url()}: ${e.message}`)
  })
  return page
}

/** No sideways scroll, and no element wider than the viewport. */
async function assertFits(page) {
  const r = await page.evaluate(() => {
    const w = document.documentElement.clientWidth
    const wide = [...document.querySelectorAll('main *')]
      .filter((el) => {
        const b = el.getBoundingClientRect()
        // Ignore anything inside a deliberately scrollable strip (filter chips).
        return b.width > 0 && (b.right > w + 1 || b.left < -1) && !el.closest('.overflow-x-auto')
      })
      .slice(0, 3)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`)
    return { sw: document.documentElement.scrollWidth, w, wide }
  })
  assert(r.sw <= r.w + 1, `page scrolls sideways: ${r.sw}px > ${r.w}px`)
  assert(r.wide.length === 0, `wider than the screen: ${r.wide.join(', ')}`)
}

// Screenshots are evidence for humans, not assertions: the checks above them
// (renders, no sideways scroll, nothing wider than the screen) stay strict.
// A screenshot that times out is retried once, then counted as a warning;
// more than MAX_SHOT_WARNINGS fails the run. Every screenshot's duration and
// what was still loading are logged, so a slow page shows up as data.
const MAX_SHOT_WARNINGS = 2
const shotLog = []
async function screenshot(page, path) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const diag = await page
      .evaluate(() => ({
        fonts: document.fonts.status,
        incompleteImages: [...document.images].filter((i) => !i.complete).map((i) => i.currentSrc.replace(location.origin, '')),
      }))
      .catch((e) => ({ error: String(e.message).slice(0, 80) }))
    const t0 = Date.now()
    try {
      await page.screenshot({ path, fullPage: true, timeout: 20000 })
      shotLog.push({ path, ms: Date.now() - t0, attempt })
      return
    } catch (e) {
      console.log(`      screenshot attempt ${attempt} of ${path} failed after ${Date.now() - t0} ms (${String(e.message).split('\n')[0]}); at start: ${JSON.stringify(diag)}`)
    }
  }
  shotLog.push({ path, ms: null, attempt: 2 })
  console.log(`WARN  screenshot skipped: ${path}`)
}

const phone = await newPage(390)
await loginAdmin(phone, sim.email)

console.log('--- Stock screens (shared stock system: Stock & batches page) ---')

await check('old Phase 2 stock links open the Stock & batches page; Quick sale still shows the notice', async () => {
  for (const path of ['/admin/stock', `/admin/stock/${rice}`, '/admin/stock/count', '/admin/stock/switch']) {
    await phone.goto(`${BASE_URL}${path}`)
    await phone.waitForURL(/\/admin\/stock$/)
    await phone.getByRole('heading', { name: 'Stock & batches' }).waitFor()
  }
  await phone.goto(`${BASE_URL}/admin/sale`)
  await phone.getByTestId('stock-moved').waitFor()
})

console.log('--- Complete details (drafts quick-added on the iPad) ---')

await check('complete a draft in the browser: details saved, status active, audited; the queue empties', async () => {
  const d = db()
  await d.collection('categories').doc('flour-cat').set({ name: 'Flours and Grains', nameZh: '面粉', isActive: true, order: 1 })
  await d.collection('products').doc('draft-1').set({
    code: 'SHELF-001', name: '', category: '', status: 'draft', isActive: false, sellPrice: 450, price: 4.5,
    createdVia: 'quick_add', imageUrls: [], unitLabel: 'pack', kind: 'standard', createdAt: new Date(),
  })
  await d.collection('stockLevels').doc('draft-1_storeroom').set({ productId: 'draft-1', locationId: 'storeroom', onHandMilli: 6000, reservedMilli: 0 })
  await phone.goto(`${BASE_URL}/admin/drafts`)
  const form = phone.getByTestId('draft-form')
  await form.waitFor()
  await form.getByText('Code SHELF-001').waitFor()
  await form.getByLabel('Name (English)').fill('Cake flour 1kg')
  await form.getByLabel('Name (Chinese)').fill('低筋面粉 1公斤')
  await form.getByLabel('Category').selectOption('flour-cat')
  await form.getByLabel('Cost (RM)').fill('3.00')
  await form.getByRole('button', { name: 'Save and next' }).click()
  await phone.getByTestId('no-drafts').waitFor()
  const p = await getDoc('products', 'draft-1')
  assert(p.status === 'active' && p.isActive === true, JSON.stringify(p))
  assert(p.name === 'Cake flour 1kg' && p.nameZh === '低筋面粉 1公斤' && p.category === 'Flours and Grains', JSON.stringify(p))
  assert(p.sellPrice === 450 && p.price === 4.5 && p.code === 'SHELF-001', JSON.stringify(p))
  assert((await getDoc('productCosts', 'draft-1'))?.costPerUnitSen === 300, 'cost not saved')
  const audit = await d.collection('auditLog').where('action', '==', 'draft.complete').get()
  assert(audit.size === 1, `audit entries: ${audit.size}`)
})

await check('completing the same draft twice is refused (e.g. already done on the iPad)', async () => {
  const res = await api('POST', '/api/admin/drafts/draft-1', { name: 'x', categoryId: 'flour-cat' })
  assert(res.status === 409, `status ${res.status}`)
})

await check('a draft with no price and quantity 0 is flagged red and cannot be completed until fixed', async () => {
  const d = db()
  await d.collection('products').doc('draft-2').set({
    code: 'SHELF-002', name: '', category: '', status: 'draft', isActive: false,
    createdVia: 'quick_add', imageUrls: [], unitLabel: 'pack', kind: 'standard', createdAt: new Date(),
  })
  await phone.goto(`${BASE_URL}/admin/drafts`)
  const form = phone.getByTestId('draft-form')
  await form.getByText('Code SHELF-002').waitFor()
  const problems = form.getByTestId('draft-problems')
  await problems.getByText('No price').waitFor()
  await problems.getByText('Quantity 0').waitFor()
  await form.getByLabel('Name (English)').fill('Shelf thing')
  await form.getByLabel('Category').selectOption('flour-cat')
  const save = form.getByRole('button', { name: 'Save and next' })
  assert(await save.isDisabled(), 'Save enabled with no price and quantity 0')
  await form.getByLabel('Sell price (RM)').fill('5.00')
  await problems.getByText('Quantity 0').waitFor()
  assert(await save.isDisabled(), 'Save enabled with quantity 0')
  // The server refuses too (an old page, or a direct call).
  let res = await api('POST', '/api/admin/drafts/draft-2', { name: 'x', categoryId: 'flour-cat' })
  assert(res.status === 400, `no price: status ${res.status}`)
  res = await api('POST', '/api/admin/drafts/draft-2', { name: 'x', categoryId: 'flour-cat', sellPriceSen: 500 })
  assert(res.status === 409, `quantity 0: status ${res.status}`)
  assert((await getDoc('products', 'draft-2')).status === 'draft', 'completed anyway')
  // Counted on the iPad: now it can be completed here.
  await d.collection('stockLevels').doc('draft-2_storeroom').set({ productId: 'draft-2', locationId: 'storeroom', onHandMilli: 3000, reservedMilli: 0 })
  await phone.reload()
  await form.getByText('Code SHELF-002').waitFor()
  await form.getByLabel('Name (English)').fill('Shelf thing')
  await form.getByLabel('Category').selectOption('flour-cat')
  await form.getByLabel('Sell price (RM)').fill('5.00')
  assert(!(await save.isDisabled()), 'Save still disabled after fixing')
  await save.click()
  await phone.getByTestId('no-drafts').waitFor()
  assert((await getDoc('products', 'draft-2')).status === 'active', 'not completed after fixing')
})

console.log('\n--- Every screen at 390 px and 1440 px ---')

const SCREENS = [
  ['dashboard', '/admin', 'Today'],
  ['orders', '/admin/orders', 'Orders'],
  ['stock', '/admin/stock', 'Stock & batches'],
  ['promos', '/admin/promos', 'Sale events'],
  ['order-held', `/admin/orders/${held.json.orderId}`, held.json.orderId],
  ['products', '/admin/products', 'Products'],
  ['drafts', '/admin/drafts', 'Complete details'],
  ['product-new', '/admin/products/new', 'Add product'],
  ['product-edit', `/admin/products/${rice}`, 'Edit product'],
]

for (const width of [390, 1440]) {
  const page = width === 390 ? phone : await newPage(width)
  if (width !== 390) await loginAdmin(page, sim.email)
  for (const [name, path, heading] of SCREENS) {
    await check(`${width}px ${name}: renders, fits the screen`, async () => {
      await page.goto(`${BASE_URL}${path}`)
      await page.getByRole('heading', { name: heading, exact: true }).first().waitFor({ timeout: 15000 })
      if (name === 'stock-switch') await page.getByRole('button', { name: /Baking/ }).click()
      if (name === 'product-edit') {
        await page.getByTestId('sell-unit').nth(2).waitFor() // wholesale size loaded
        await page.getByTestId('price-button').first().click() // keypad open
      }
      if (name === 'sale') {
        await page.getByLabel('Find a product').fill('rice')
        await page.getByTestId('sale-results').getByRole('button').first().click()
      }
      await sleep(400)
      await assertFits(page)
      await screenshot(page, `${SHOTS}/${name}-${width}.png`)
    })
  }
}

await check('the product editor loads the wholesale size (private) into the sizes list', async () => {
  await phone.goto(`${BASE_URL}/admin/products/${rice}`)
  await phone.getByTestId('sell-unit').nth(2).waitFor()
  const labels = await phone.getByTestId('sell-unit').evaluateAll((els) => els.map((e) => e.querySelector('input').value))
  assert(labels.join() === '1 kg,500 g pack,25 kg bag', labels.join())
})

await check(`screenshots: at most ${MAX_SHOT_WARNINGS} skipped`, async () => {
  const skipped = shotLog.filter((x) => x.ms === null)
  const timed = shotLog.filter((x) => x.ms !== null)
  const slowest = timed.reduce((a, b) => (b.ms > a.ms ? b : a), { ms: 0, path: '-' })
  const retried = shotLog.filter((x) => x.attempt === 2 && x.ms !== null).length
  console.log(`      screenshots: ${timed.length} taken, ${retried} needed a retry, ${skipped.length} skipped (warnings); slowest ${slowest.ms} ms (${slowest.path})`)
  assert(skipped.length <= MAX_SHOT_WARNINGS, `${skipped.length} screenshot warnings: ${skipped.map((x) => x.path).join(', ')}`)
})

await check('no uncaught page errors on any screen', async () => {
  assert(pageErrors.length === 0, pageErrors.join(' | '))
})

console.log(`\nScreenshots: ${SHOTS}`)
await browser.close()
process.exit(summary() ? 1 : 0)
