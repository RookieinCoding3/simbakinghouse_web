// Every Phase 2 admin screen in a real browser (WebKit) against the emulator:
// the stock flows at phone size, then every screen at 390 px and 1440 px for
// layout (no sideways scroll, nothing cut off), page errors, and screenshots
// (saved to SHOTS_DIR, default .screenshots/phase2). Run inside test-env.sh.
import { mkdirSync } from 'fs'
import { webkit } from 'playwright'
import { BASE_URL, db, resetEmulators, createAdmin, check, assert, summary } from './lib/emu.mjs'
import { apiAs, createProduct, switchOn, placeOrders, loginAdmin, waitForDoc, getDoc, opId, sleep } from './lib/phase2.mjs'

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
    if (!/127\.0\.0\.1:(8080|9099|9199)\/.*access control checks/.test(e.message)) pageErrors.push(`${width}px ${page.url()}: ${e.message}`)
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

const phone = await newPage(390)
await loginAdmin(phone, sim.email)

console.log('--- Stock tab ---')

await check('Stock tab: managed count, running-low box (Butter low, Fondant out), Quick sale / Count / Switch over links', async () => {
  await phone.goto(`${BASE_URL}/admin/stock`)
  await phone.getByTestId('stock-list').waitFor()
  await phone.getByText('3 of 7 products managed here').waitFor()
  const low = await phone.locator('section[aria-labelledby="running-low"]').innerText()
  assert(/Running low \(2\)/.test(low) && /Butter 250g\s*2 pc left/.test(low) && /Fondant \(custom colour\)\s*Out/.test(low), low)
  for (const name of ['Quick sale', /Count stock/, /Switch over/]) assert(await phone.getByRole('link', { name }).count(), `link ${name}`)
})

await check('Stock tab: rice row shows on hand, held and available; filters Low / Out / Not managed; barcode search', async () => {
  const riceRow = await phone.locator(`[data-product-id="${rice}"]`).innerText()
  assert(/14 kg on hand · 2 kg held · 12 kg available/.test(riceRow), riceRow)
  const names = async () => phone.locator('[data-testid=stock-list] [data-product-id] p:first-child').allInnerTexts()
  await phone.getByRole('tab', { name: 'Low' }).click()
  assert(JSON.stringify(await names()) === '["Butter 250g"]', `Low: ${await names()}`)
  await phone.getByRole('tab', { name: 'Out' }).click()
  assert(JSON.stringify(await names()) === '["Fondant (custom colour)"]', `Out: ${await names()}`)
  await phone.getByRole('tab', { name: 'Not managed' }).click()
  assert((await names()).sort().join() === 'Balloon whisk,Cake tin 8in,Cocoa powder 500g,Rainbow sprinkles', `Not managed: ${await names()}`)
  await phone.getByRole('tab', { name: 'All' }).click()
  await phone.locator('#stock-search').fill('9555000000017')
  assert(JSON.stringify(await names()) === '["Rice flour"]', `barcode: ${await names()}`)
})

console.log('\n--- Product history and adjust ---')

await check('history lists every change with who and why (switch-on count, restock, damaged, order hold)', async () => {
  await phone.goto(`${BASE_URL}/admin/stock/${rice}`)
  await phone.getByTestId('history').waitFor()
  const h = await phone.getByTestId('history').innerText()
  for (const want of ['Held for order', 'Damaged', 'torn bag', 'Restock', 'supplier delivery', 'sim@sbh.test']) assert(h.includes(want), `history missing "${want}":\n${h}`)
  const nums = await phone.getByTestId('stock-numbers').innerText()
  assert(/14 kg\s*On hand\s*2 kg\s*Held for orders\s*12 kg\s*Available/.test(nums), nums)
})

await check('adjust: Restock 3 kg shows a confirm line (14 kg → 17 kg), saves, and appears at the top of the history', async () => {
  await phone.locator('#adjust-qty').fill('3')
  await phone.getByRole('button', { name: 'Review' }).click()
  const line = await phone.getByTestId('confirm-line').innerText()
  assert(line === 'Rice flour: 14 kg → 17 kg', line)
  await phone.getByRole('button', { name: 'Confirm' }).click()
  await phone.getByRole('status').filter({ hasText: 'Saved: Rice flour is now 17 kg.' }).waitFor()
  assert((await getDoc('inventory', rice)).onHandMilli === 17000, 'not saved')
  await phone.getByTestId('history').locator('li').first().filter({ hasText: '+3 kg' }).waitFor()
})

await check('adjust: a count correction with the − / + buttons (17 → 16 kg)', async () => {
  await phone.getByRole('radio', { name: /Count correction/ }).click()
  await phone.locator('#adjust-qty').fill('17')
  await phone.getByRole('button', { name: 'Less' }).click()
  await phone.getByRole('button', { name: 'Review' }).click()
  assert((await phone.getByTestId('confirm-line').innerText()) === 'Rice flour: 17 kg → 16 kg', 'confirm line')
  await phone.getByRole('button', { name: 'Confirm' }).click()
  await waitForDoc('inventory', rice, (i) => i.onHandMilli === 16000)
})

await check('adjust on an expiry-tracked product asks for the expiry date and records a batch', async () => {
  await phone.goto(`${BASE_URL}/admin/stock/${butter}`)
  await phone.getByLabel('Expiry date').fill('2027-01-15')
  await phone.locator('#adjust-qty').fill('4')
  await phone.getByRole('button', { name: 'Review' }).click()
  await phone.getByRole('button', { name: 'Confirm' }).click()
  await waitForDoc('inventory', butter, (i) => i.onHandMilli === 6000)
  const batches = (await db().collection('batches').where('productId', '==', butter).get()).docs.map((d) => d.data().expiryDate)
  assert(batches.includes('2027-01-15'), `batches: ${batches}`)
})

console.log('\n--- Count mode ---')

await check('count mode: managed only by default; typed counts show the difference; review → apply updates stock', async () => {
  await phone.goto(`${BASE_URL}/admin/stock/count`)
  await phone.getByLabel('Counted Rice flour').fill('15.5')
  await phone.getByText('system says 16 kg · -0.5 kg').waitFor()
  await phone.getByLabel('Counted Butter 250g').fill('6')
  await phone.getByText('system says 6 pc · matches').waitFor()
  assert((await phone.getByLabel('Counted Cake tin 8in').count()) === 0, 'unmanaged shown with "Managed only" ticked')
  await phone.getByRole('button', { name: 'Review 2 counts' }).click()
  const review = await phone.getByTestId('count-review').innerText()
  assert(/Rice flour\s*16 kg → 15.5 kg/.test(review), review)
  await phone.getByRole('button', { name: 'Apply count' }).click()
  await phone.getByRole('status').filter({ hasText: 'Count saved: 2 managed products updated' }).waitFor()
  assert((await getDoc('inventory', rice)).onHandMilli === 15500, 'count not applied')
})

await check('count mode: a bad number blocks review; an unmanaged product count is saved as an opening count only', async () => {
  await phone.getByLabel('Managed only').uncheck()
  await phone.getByLabel('Counted Cocoa powder 500g').fill('7,5x')
  await phone.getByRole('button', { name: 'Fix 1 number' }).waitFor()
  await phone.getByLabel('Counted Cocoa powder 500g').fill('7')
  await phone.getByRole('button', { name: 'Review 1 count' }).click()
  assert(/opening count 7 pc/.test(await phone.getByTestId('count-review').innerText()), 'review text')
  await phone.getByRole('button', { name: 'Apply count' }).click()
  await phone.getByRole('status').filter({ hasText: '1 opening count saved for switching on' }).waitFor()
  assert((await getDoc('stockCountDrafts', 'cocoa')).countedMilli === 7000, 'draft not saved')
  assert((await getDoc('products', 'cocoa')).managedStock !== true && (await getDoc('inventory', 'cocoa')) === null, 'became managed')
})

console.log('\n--- Switching on and off ---')

await check('switch-on (one product): the opening count is prefilled; needs the "old system" tick; then managed with 7 pc', async () => {
  await phone.goto(`${BASE_URL}/admin/stock/cocoa`)
  await phone.getByRole('heading', { name: 'Not managed here yet' }).waitFor()
  assert((await phone.locator('#opening-count').inputValue()) === '7', 'draft not prefilled')
  const go = phone.getByRole('button', { name: '3. Switch on' })
  assert(await go.isDisabled(), 'enabled before the tick')
  await phone.locator('#stopped-old').check()
  await go.click()
  // The live data flips the page to its managed view (numbers + history).
  await phone.getByTestId('stock-numbers').filter({ hasText: '7 pc' }).waitFor()
  await waitForDoc('products', 'cocoa', (p) => p.managedStock === true && p.stockStatus === 'in_stock')
  assert((await getDoc('inventory', 'cocoa')).onHandMilli === 7000, 'inventory')
  await phone.getByTestId('stock-numbers').waitFor()
})

await check('switch over a whole category (Tools): count both (one with "Set 0"), save, confirm, switch on', async () => {
  await phone.goto(`${BASE_URL}/admin/stock/switch`)
  await phone.getByRole('button', { name: /Tools/ }).click()
  assert((await phone.getByTestId('progress-Tools').innerText()) === '0 of 2 managed', 'progress')
  assert(await phone.getByRole('button', { name: 'Count all 2 products first' }).isDisabled(), 'switch enabled before counts')
  await phone.getByLabel('Count for Cake tin 8in').fill('4')
  await phone.locator('li li', { hasText: 'Balloon whisk' }).getByRole('button', { name: 'Set 0' }).click()
  await phone.getByRole('button', { name: 'Save 2 counts' }).click()
  await phone.getByRole('button', { name: 'Switch Tools to managed' }).click()
  const on = phone.getByRole('button', { name: 'Switch on' })
  assert(await on.isDisabled(), 'switch on enabled before the confirmation tick')
  await phone.locator('#confirm-old-system').check()
  await on.click()
  await phone.getByText('Every product in Tools is managed here.').waitFor()
  await phone.getByTestId('progress-Tools').filter({ hasText: '2 of 2 managed' }).waitFor()
  assert((await getDoc('products', 'whisk')).stockStatus === 'out' && (await getDoc('products', 'tin')).stockStatus === 'low', 'statuses (tin: 4 pc is under the default low level of 5)')
})

await check('switch off: product sells like before; numbers and history are kept', async () => {
  await phone.goto(`${BASE_URL}/admin/stock/whisk`)
  await phone.getByRole('button', { name: 'Stop managing stock here' }).click()
  await phone.getByRole('button', { name: 'Stop managing' }).click()
  await phone.getByRole('heading', { name: 'Not managed here yet' }).waitFor()
  const p = await getDoc('products', 'whisk')
  assert(p.managedStock === false && !('stockStatus' in p), JSON.stringify(p))
  assert((await getDoc('inventory', 'whisk')) !== null, 'inventory deleted')
})

console.log('\n--- Every screen at 390 px and 1440 px ---')

const SCREENS = [
  ['orders', '/admin', 'Orders'],
  ['order-held', `/admin/orders/${held.json.orderId}`, held.json.orderId],
  ['stock', '/admin/stock', 'Stock'],
  ['stock-product', `/admin/stock/${rice}`, 'Rice flour'],
  ['stock-unmanaged', '/admin/stock/sprinkles', 'Rainbow sprinkles'],
  ['stock-count', '/admin/stock/count', 'Count stock'],
  ['stock-switch', '/admin/stock/switch', 'Switch over'],
  ['products', '/admin/products', 'Products'],
  ['product-new', '/admin/products/new', 'Add product'],
  ['product-edit', `/admin/products/${rice}`, 'Edit product'],
  ['sale', '/admin/sale', 'Quick sale'],
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
      await page.screenshot({ path: `${SHOTS}/${name}-${width}.png`, fullPage: true })
    })
  }
}

await check('the product editor loads the wholesale size (private) into the sizes list', async () => {
  await phone.goto(`${BASE_URL}/admin/products/${rice}`)
  await phone.getByTestId('sell-unit').nth(2).waitFor()
  const labels = await phone.getByTestId('sell-unit').evaluateAll((els) => els.map((e) => e.querySelector('input').value))
  assert(labels.join() === '1 kg,500 g pack,25 kg bag', labels.join())
})

await check('no uncaught page errors on any screen', async () => {
  assert(pageErrors.length === 0, pageErrors.join(' | '))
})

console.log(`\nScreenshots: ${SHOTS}`)
await browser.close()
process.exit(summary() ? 1 : 0)
