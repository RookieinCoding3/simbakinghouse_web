// Admin order page → /api/admin/orders/[id]/transition, in a real browser
// (WebKit, phone size) against the emulator. Run inside scripts/test-env.sh.
import { webkit } from 'playwright'
import { BASE_URL, db, resetEmulators, createAdmin, check, assert, summary } from './lib/emu.mjs'
import { apiAs, createProduct, switchOn, placeOrders, loginAdmin, waitForDoc, getDoc, opId } from './lib/phase2.mjs'

await resetEmulators()
const sim = await createAdmin('sim@sbh.test', 'owner')
const api = apiAs(sim.email)

await db().collection('products').doc('legacy').set({ name: 'Bread flour 1kg', price: 6.5, category: 'Flour', inStock: true, stockCount: 10 })
await db().collection('products').doc('ask').set({ name: 'Custom cake topper', category: 'Decorations', inStock: true })
const rice = await createProduct(api, {
  name: 'Rice flour', category: 'Flour', baseUnit: 'kg', lowStockThresholdMilli: 1000, trackExpiry: false, barcodes: [],
  sellUnits: [{ id: 'kg1', label: '1 kg', factorMilli: 1000, priceSen: 650, channel: 'both' }],
})
await switchOn(api, rice, 10000)

const [managed, toCancel, toShort, legacy, ask] = await placeOrders([
  [{ productId: rice, sellUnitId: 'kg1', qty: 2 }],
  [{ productId: rice, sellUnitId: 'kg1', qty: 3 }],
  [{ productId: rice, sellUnitId: 'kg1', qty: 4 }],
  [{ productId: 'legacy', qty: 2 }],
  [{ productId: 'ask', qty: 1 }, { productId: 'legacy', qty: 1 }],
])
for (const r of [managed, toCancel, toShort, legacy, ask]) assert(r.status === 201, `order: ${r.status} ${r.json.error}`)

const browser = await webkit.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
const pageErrors = []
// WebKit reports Firestore's long-poll channel being cut off by a page
// navigation as an error; that's the browser tearing down a request, not
// the app failing.
page.on('pageerror', (e) => {
  if (!/Firestore\/(Listen|Write)\/channel.*access control checks/.test(e.message)) pageErrors.push(e.message)
})
await loginAdmin(page, sim.email)

async function openOrder(id) {
  await page.goto(`${BASE_URL}/admin/orders/${id}`)
  await page.getByRole('heading', { name: id }).waitFor({ timeout: 15000 })
}
const tap = (name) => page.getByRole('button', { name, exact: true }).click()

await check('managed order: the line shows its size; Accept holds the stock (reserved 2 kg)', async () => {
  const id = managed.json.orderId
  await openOrder(id)
  assert(await page.getByText('2 x Rice flour').count(), 'line missing')
  assert(await page.getByText('· 1 kg').count(), 'size label missing')
  await page.getByLabel('Final total (RM)').fill('13.00')
  await tap('Accept')
  await page.getByTestId('stock-state').filter({ hasText: 'held' }).waitFor({ timeout: 10000 })
  const o = await getDoc('orders', id)
  assert(o.status === 'confirmed' && o.confirmedTotalSen === 1300 && o.confirmedTotal === 13, JSON.stringify(o))
  const i = await getDoc('inventory', rice)
  assert(i.reservedMilli === 2000 && i.onHandMilli === 10000, JSON.stringify(i))
})

await check('managed order: Mark paid → Mark ready → Mark collected deducts the stock (10 → 8 kg)', async () => {
  const id = managed.json.orderId
  await tap('Mark paid')
  await page.getByRole('button', { name: 'Mark ready' }).waitFor()
  await tap('Mark ready')
  await page.getByRole('button', { name: 'Mark collected' }).waitFor()
  await tap('Mark collected')
  await page.getByText('Collected.', { exact: true }).waitFor()
  await page.getByTestId('stock-state').filter({ hasText: 'taken off' }).waitFor()
  const i = await getDoc('inventory', rice)
  assert(i.onHandMilli === 8000 && i.reservedMilli === 0, JSON.stringify(i))
})

await check('confirmed managed order: Cancel releases the hold', async () => {
  const id = toCancel.json.orderId
  await openOrder(id)
  await page.getByLabel('Final total (RM)').fill('19.50')
  await tap('Accept')
  await waitForDoc('inventory', rice, (i) => i.reservedMilli === 3000)
  await page.getByRole('button', { name: 'Cancel order' }).click()
  await page.getByLabel('Reason').fill('Customer changed mind')
  await tap('Confirm cancel')
  await page.getByText(/Cancelled — Customer changed mind/).waitFor()
  await page.getByTestId('stock-state').filter({ hasText: 'released' }).waitFor()
  const i = await getDoc('inventory', rice)
  assert(i.reservedMilli === 0 && i.onHandMilli === 8000, JSON.stringify(i))
})

await check('short stock: Accept shows the server message and the short list; the order stays new', async () => {
  const id = toShort.json.orderId
  await api('POST', '/api/admin/stock/adjust', { opId: opId(), productId: rice, reason: 'damaged', qtyMilli: 5000, note: 'wet' })
  await openOrder(id)
  await page.getByLabel('Final total (RM)').fill('26')
  await tap('Accept')
  await page.getByTestId('short-list').waitFor({ timeout: 10000 })
  const text = await page.getByTestId('short-list').innerText()
  assert(/Rice flour: need 4 kg, only 3 kg available/.test(text), text)
  assert((await getDoc('orders', id)).status === 'new', 'status changed')
  assert((await getDoc('inventory', rice)).reservedMilli === 0, 'stock held anyway')
})

await check('old (unmanaged) order: full flow works; legacy stockCount still goes down on collect', async () => {
  const id = legacy.json.orderId
  await openOrder(id)
  assert((await page.getByLabel('Final total (RM)').inputValue()) === '13.00', 'total not prefilled')
  await tap('Accept')
  await page.getByRole('button', { name: 'Mark paid' }).waitFor()
  await tap('Mark paid')
  await page.getByRole('button', { name: 'Mark ready' }).waitFor()
  await tap('Mark ready')
  await page.getByRole('button', { name: 'Mark collected' }).waitFor()
  await tap('Mark collected')
  await page.getByText('Collected.', { exact: true }).waitFor()
  assert((await getDoc('products', 'legacy')).stockCount === 8, 'stockCount not decremented')
  assert(!(await getDoc('orders', id)).stock, 'unmanaged order got a stock record')
  assert((await page.getByTestId('stock-state').count()) === 0, 'stock note shown for an unmanaged order')
})

await check('"Ask for price" order: banner shown, total box empty, Accept with an empty total is refused', async () => {
  const id = ask.json.orderId
  await openOrder(id)
  await page.getByTestId('price-to-confirm').waitFor()
  assert((await page.getByLabel('Final total (RM)').inputValue()) === '', 'partial total prefilled')
  await tap('Accept')
  await page.getByText('Enter a valid total').waitFor()
  assert((await getDoc('orders', id)).status === 'new', 'accepted without a total')
  await page.getByLabel('Final total (RM)').fill('56.50')
  await tap('Accept')
  await waitForDoc('orders', id, (o) => o.status === 'confirmed' && o.confirmedTotalSen === 5650)
})

await check('the page never writes the order from the browser (no Firestore Write channel opened)', async () => {
  const writes = []
  page.on('request', (r) => {
    if (/google\.firestore\.v1\.Firestore\/Write/.test(r.url())) writes.push(r.url())
  })
  const [r] = await placeOrders([[{ productId: 'legacy', qty: 1 }]])
  await openOrder(r.json.orderId)
  await tap('Accept')
  await waitForDoc('orders', r.json.orderId, (o) => o.status === 'confirmed')
  assert(writes.length === 0, `browser wrote to Firestore: ${writes[0]}`)
})

await check('no uncaught page errors', async () => {
  assert(pageErrors.length === 0, pageErrors.join(' | '))
})

await browser.close()
process.exit(summary() ? 1 : 0)
