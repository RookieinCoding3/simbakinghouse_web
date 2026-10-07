// Walk-in quick sale (/admin/sale → /api/admin/sales) in a real browser
// (WebKit, phone size), plus till-price rules over the API. Emulator only.
// Run inside scripts/test-env.sh.
import { webkit } from 'playwright'
import { BASE_URL, db, resetEmulators, createAdmin, check, assert, summary } from './lib/emu.mjs'
import { apiAs, createProduct, switchOn, loginAdmin, waitForDoc, getDoc, opId, sleep } from './lib/phase2.mjs'

await resetEmulators()
const sim = await createAdmin('sim@sbh.test', 'owner')
const api = apiAs(sim.email)

const ASK_LEGACY = { name: 'Cake topper (custom)', category: 'Decorations', inStock: true }
await db().collection('products').doc('ask').set(ASK_LEGACY)
const rice = await createProduct(api, {
  name: 'Rice flour', category: 'Flour', baseUnit: 'kg', lowStockThresholdMilli: 1000, trackExpiry: false, barcodes: ['9555000000017'],
  sellUnits: [
    { id: 'kg1', label: '1 kg', factorMilli: 1000, priceSen: 650, channel: 'both' },
    { id: 'bag5', label: '5 kg bag', factorMilli: 5000, priceSen: 2800, channel: 'wholesale' },
  ],
})
await switchOn(api, rice, 20000)
const fondant = await createProduct(api, {
  name: 'Fondant (custom colour)', category: 'Decorations', baseUnit: 'kg', lowStockThresholdMilli: 1000, trackExpiry: false, barcodes: [],
  sellUnits: [{ id: 'kg1', label: '1 kg', factorMilli: 1000, priceSen: null, channel: 'both' }],
})
await switchOn(api, fondant, 5000)

const browser = await webkit.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
const pageErrors = []
page.on('pageerror', (e) => {
  if (!/Firestore\/(Listen|Write)\/channel.*access control checks/.test(e.message)) pageErrors.push(e.message)
})
await loginAdmin(page, sim.email)

const salesOf = async () => (await db().collection('sales').get()).docs.map((d) => ({ id: d.id, ...d.data() }))
async function addItem(searchText, productName, sizeLabel, { qty = 1, keys } = {}) {
  await page.getByLabel('Find a product').fill(searchText)
  await page.getByTestId('sale-results').getByRole('button', { name: new RegExp(productName.replace(/[()]/g, '\\$&')) }).click()
  const picker = page.getByTestId('sale-picker')
  if (sizeLabel) await picker.getByRole('radio', { name: new RegExp(`^${sizeLabel}`) }).click()
  for (let i = 1; i < qty; i++) await picker.getByRole('button', { name: 'One more' }).click()
  if (keys) for (const k of keys) await picker.getByRole('button', { name: k, exact: true }).click()
  await picker.getByRole('button', { name: 'Add to sale' }).click()
}
async function payAndFinish(method = 'Cash') {
  await page.getByRole('radio', { name: method }).click()
  await page.getByRole('button', { name: /^Done/ }).click()
}

const bottomBadge = () => page.locator('nav[aria-label="Admin sections"]').getByTestId('stock-badge')

await check('Stock-tab badge: hidden while nothing is running low', async () => {
  await page.goto(`${BASE_URL}/admin`)
  await page.locator('nav[aria-label="Admin sections"]').waitFor()
  await sleep(1500)
  assert((await bottomBadge().count()) === 0, 'badge shown with nothing low')
})

await check('the Stock tab "Quick sale" link opens the sale screen (no 404)', async () => {
  await page.goto(`${BASE_URL}/admin/stock`)
  await page.getByRole('link', { name: /Quick sale/i }).click()
  await page.waitForURL(/\/admin\/sale$/)
  await page.getByRole('heading', { name: 'Quick sale' }).waitFor()
  await page.getByText('No sales yet today.').waitFor()
})

await check('sell 2 x 1 kg rice for cash: total RM 13.00, stock 20 → 18 kg, listed under today', async () => {
  await addItem('rice', 'Rice flour', '1 kg', { qty: 2 })
  assert((await page.getByTestId('sale-total').innerText()).includes('RM 13.00'), await page.getByTestId('sale-total').innerText())
  await payAndFinish('Cash')
  await page.getByTestId('sale-done').filter({ hasText: 'Sale recorded: RM 13.00' }).waitFor()
  assert((await getDoc('inventory', rice)).onHandMilli === 18000, 'stock not deducted')
  await page.getByTestId('today-sales').getByText('2 x Rice flour (1 kg)').waitFor()
})

await check('barcode search finds the product; the wholesale size sells at its wholesale price', async () => {
  await addItem('9555000000017', 'Rice flour', '5 kg bag')
  await payAndFinish('DuitNow')
  await page.getByTestId('sale-done').filter({ hasText: 'RM 28.00' }).waitFor()
  assert((await getDoc('inventory', rice)).onHandMilli === 13000, 'wholesale not deducted 5 kg')
})

await check('"Ask for price" item: Add is blocked until the till price is typed; price saved on the sale line only', async () => {
  await page.getByLabel('Find a product').fill('topper')
  await page.getByTestId('sale-results').getByRole('button', { name: /Cake topper/ }).click()
  const picker = page.getByTestId('sale-picker')
  await picker.getByTestId('till-price').waitFor()
  assert(await picker.getByRole('button', { name: 'Add to sale' }).isDisabled(), 'Add enabled without a price')
  for (const k of ['1', '5', '00']) await picker.getByRole('button', { name: k, exact: true }).click()
  await picker.getByRole('button', { name: 'Add to sale' }).click()
  await page.getByTestId('sale-cart').getByText('(till price)').waitFor()
  await payAndFinish('Cash')
  await page.getByTestId('sale-done').filter({ hasText: 'RM 15.00' }).waitFor()
  const sale = (await salesOf()).find((s) => s.items[0].productId === 'ask')
  assert(sale.items[0].unitPriceSen === 1500 && sale.items[0].priceSource === 'till' && sale.totalSen === 1500, JSON.stringify(sale.items[0]))
  assert(JSON.stringify(await getDoc('products', 'ask')) === JSON.stringify(ASK_LEGACY), 'product doc changed')
})

await check('"Ask for price" + managed: till price charged, stock still comes off (5 → 3 kg)', async () => {
  await addItem('fondant', 'Fondant', null, { qty: 2, keys: ['2', '0', '00'] })
  assert((await page.getByTestId('sale-total').innerText()).includes('RM 40.00'), await page.getByTestId('sale-total').innerText())
  await payAndFinish('Card')
  await page.getByTestId('sale-done').filter({ hasText: 'RM 40.00' }).waitFor()
  assert((await getDoc('inventory', fondant)).onHandMilli === 3000, 'managed Ask-for-price not deducted')
})

await check('selling more than available shows the short list; "Sell anyway" records it as oversold', async () => {
  await addItem('fondant', 'Fondant', null, { qty: 4, keys: ['1', '0', '00'] })
  await payAndFinish('Cash')
  await page.getByTestId('sale-short').waitFor()
  assert(/Fondant \(custom colour\): selling 4 kg, only 3 kg available/.test(await page.getByTestId('sale-short').innerText()), 'short list text')
  assert((await getDoc('inventory', fondant)).onHandMilli === 3000, 'deducted before Sell anyway')
  await page.getByRole('button', { name: /Sell anyway/ }).click()
  await page.getByTestId('sale-done').waitFor()
  assert((await getDoc('inventory', fondant)).onHandMilli === -1000, 'oversold not recorded')
  assert((await getDoc('products', fondant)).stockStatus === 'out', 'status not out')
  assert((await salesOf()).some((s) => s.oversold === true), 'sale not flagged oversold')
})

await check('Stock-tab badge: shows 1 live once Fondant runs out; the tab is labelled for screen readers', async () => {
  await bottomBadge().filter({ hasText: /^1$/ }).waitFor({ timeout: 10000 })
  const label = await page.locator('nav[aria-label="Admin sections"] a', { hasText: 'Stock' }).getAttribute('aria-label')
  assert(label === 'Stock, 1 running low', `aria-label: ${label}`)
})

await check('Stock-tab badge: a second product going low makes it 2; a restock brings it back to 1 (live, no reload)', async () => {
  await api('POST', '/api/admin/stock/adjust', { opId: opId(), productId: rice, reason: 'count', countedMilli: 500 })
  await bottomBadge().filter({ hasText: /^2$/ }).waitFor({ timeout: 10000 })
  await api('POST', '/api/admin/stock/adjust', { opId: opId(), productId: rice, reason: 'count', countedMilli: 15000 })
  await bottomBadge().filter({ hasText: /^1$/ }).waitFor({ timeout: 10000 })
})

await check('Stock-tab badge on desktop (1440 px): shown next to "Stock" in the top bar', async () => {
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const p2 = await desk.newPage()
  await loginAdmin(p2, sim.email)
  await p2.locator('header').getByTestId('stock-badge').filter({ hasText: /^1$/ }).waitFor({ timeout: 10000 })
  await desk.close()
})

await check('double-tapping Done records the sale once', async () => {
  await addItem('rice', 'Rice flour', '1 kg')
  await page.getByRole('radio', { name: 'Cash' }).click()
  const before = (await salesOf()).length
  // Two clicks in the same tick: both handlers run before React re-renders
  // the button as busy, so two requests really go out with the same saleId.
  await page.getByRole('button', { name: /^Done/ }).evaluate((b) => {
    b.click()
    b.click()
  })
  await page.getByTestId('sale-done').filter({ hasText: 'RM 6.50' }).waitFor()
  await sleep(1000)
  assert((await salesOf()).length === before + 1, `sales: ${before} → ${(await salesOf()).length}`)
  assert((await getDoc('inventory', rice)).onHandMilli === 14000, 'deducted twice')
})

await check('Void from today\'s list (with a reason) restores the stock and keeps the sale, marked voided', async () => {
  const sale = (await salesOf()).filter((s) => s.items[0].productId === rice && s.items[0].qty === 2)[0]
  const row = page.locator(`[data-sale-id="${sale.id}"]`)
  await row.getByRole('button', { name: 'Void' }).click()
  await row.getByLabel('Reason for void').fill('Wrong item rung up')
  await row.getByRole('button', { name: 'Confirm void' }).click()
  await waitForDoc('sales', sale.id, (s) => s.status === 'voided')
  await row.getByText(/voided/).waitFor()
  assert((await getDoc('inventory', rice)).onHandMilli === 16000, 'stock not restored')
})

console.log('\n--- Till price rules (API) ---')

const sell = (items, extra = {}) => api('POST', '/api/admin/sales', { saleId: opId(), paymentMethod: 'cash', items, ...extra })

await check('an "Ask for price" line without a till price is refused (400), naming the item', async () => {
  const r = await sell([{ productId: 'ask', qty: 1 }])
  assert(r.status === 400 && /Cake topper/.test(r.json.error), `${r.status} ${r.json.error}`)
})

await check('a till price of 0, a fraction, or text is refused', async () => {
  for (const bad of [0, 12.5, '1500', -100]) {
    const r = await sell([{ productId: 'ask', qty: 1, tillPriceSen: bad }])
    assert(r.status === 400, `${JSON.stringify(bad)} → ${r.status}`)
  }
})

await check('a till price sent for a priced size is ignored: it sells at its own price', async () => {
  const r = await sell([{ productId: rice, sellUnitId: 'kg1', qty: 1, tillPriceSen: 1 }])
  assert(r.status === 201 && r.json.totalSen === 650, `${r.status} ${r.json.totalSen}`)
})

await check('two lines of the same "Ask for price" item at different till prices are kept separately', async () => {
  const saleId = opId()
  const r = await api('POST', '/api/admin/sales', {
    saleId, paymentMethod: 'cash',
    items: [{ productId: 'ask', qty: 1, tillPriceSen: 1000 }, { productId: 'ask', qty: 2, tillPriceSen: 1200 }],
  })
  assert(r.status === 201 && r.json.totalSen === 3400, `${r.status} ${r.json.totalSen}`)
  const s = await getDoc('sales', saleId)
  assert(s.items.map((i) => `${i.qty}@${i.unitPriceSen}`).join() === '1@1000,2@1200', JSON.stringify(s.items))
})

await check('no uncaught page errors', async () => {
  assert(pageErrors.length === 0, pageErrors.join(' | '))
})

await browser.close()
process.exit(summary() ? 1 : 0)
