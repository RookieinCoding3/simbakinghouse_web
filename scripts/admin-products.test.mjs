// Product editor (components/admin/ProductForm.tsx → /api/admin/products) in
// a real browser (WebKit, phone size), plus "Ask for price" under managed
// stock over the API. Emulator only. Run inside scripts/test-env.sh.
import { webkit } from 'playwright'
import { BASE_URL, db, resetEmulators, createAdmin, check, assert, summary } from './lib/emu.mjs'
import { apiAs, createProduct, switchOn, placeOrders, loginAdmin, waitForDoc, getDoc, sleep } from './lib/phase2.mjs'

await resetEmulators()
const sim = await createAdmin('sim@sbh.test', 'owner')
const api = apiAs(sim.email)

await db().collection('products').doc('legacy').set({
  name: 'Bread flour 1kg', price: 6.5, category: 'Flour', inStock: true, featured: true, mentorNote: 'Sim uses this', description: 'Strong flour',
})
await db().collection('products').doc('ask-legacy').set({ name: 'Cake topper', category: 'Decorations', inStock: true })
await db().collection('categories').doc('flour').set({ name: 'Flour' })
const rice = await createProduct(api, {
  name: 'Rice flour', category: 'Flour', baseUnit: 'kg', lowStockThresholdMilli: 1000, trackExpiry: false, barcodes: [],
  sellUnits: [{ id: 'kg1', label: '1 kg', factorMilli: 1000, priceSen: 650, channel: 'both' }],
})
await switchOn(api, rice, 10000)

const browser = await webkit.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
const pageErrors = []
page.on('pageerror', (e) => {
  if (!/Firestore\/(Listen|Write)\/channel.*access control checks/.test(e.message)) pageErrors.push(e.message)
})
await loginAdmin(page, sim.email)

const units = () => page.getByTestId('sell-unit')
async function tapKeys(unitIndex, keys) {
  const unit = units().nth(unitIndex)
  for (const k of keys) await unit.getByRole('button', { name: k, exact: true }).click()
}
async function newestProduct(name) {
  const snap = await db().collection('products').where('name', '==', name).get()
  assert(snap.size === 1, `expected one "${name}", found ${snap.size}`)
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

console.log('--- Product editor ---')

await check('new product: add a category (EN + ZH), three sizes priced on the keypad incl. wholesale and "Ask for price"', async () => {
  await page.goto(`${BASE_URL}/admin/products/new`)
  await page.getByLabel('Name', { exact: true }).fill('Wedding cake flour')
  await page.getByLabel('Category').selectOption('__add_new__')
  await page.getByLabel('New category (English)').fill('Speciality Flour')
  await page.getByLabel('Chinese name (optional)').fill('特制面粉')
  await page.getByRole('button', { name: 'Add category' }).click()
  await page.getByTestId('new-category').waitFor({ state: 'detached' })
  assert((await page.getByLabel('Category').inputValue()) === 'Speciality Flour', 'new category not selected')
  await page.getByLabel('Counted in').selectOption('kg')

  // Size 1: "1 kg", RM 6.50 typed on the keypad.
  await units().nth(0).getByLabel('Size name').fill('1 kg')
  await units().nth(0).getByLabel('Ask for price').uncheck()
  await tapKeys(0, ['6', '5', '0'])
  assert((await units().nth(0).getByTestId(/-display$/).innerText()).includes('6.50'), 'keypad display wrong')
  await units().nth(0).getByRole('button', { name: 'Done' }).click()
  assert((await units().nth(0).getByTestId('price-button').innerText()) === 'RM 6.50', 'price button wrong')

  // Size 2: wholesale 25 kg bag, RM 130.00 (with a typo fixed by ⌫).
  await page.getByRole('button', { name: '+ Add a size' }).click()
  await units().nth(1).getByLabel('Size name').fill('25 kg bag')
  await units().nth(1).getByLabel('Uses (kg)').fill('25')
  await units().nth(1).getByLabel('Sold').selectOption('wholesale')
  await units().nth(1).getByLabel('Ask for price').uncheck()
  await tapKeys(1, ['1', '3', '9', 'Delete last digit', '0', '00'])
  await units().nth(1).getByRole('button', { name: 'Done' }).click()
  assert((await units().nth(1).getByTestId('price-button').innerText()) === 'RM 130.00', 'wholesale price wrong')

  // Size 3: "Custom blend", Ask for price (the default for a new size).
  await page.getByRole('button', { name: '+ Add a size' }).click()
  await units().nth(2).getByLabel('Size name').fill('Custom blend')
  await units().nth(2).getByLabel('Uses (kg)').fill('5')
  assert((await units().nth(2).getByTestId('price-button').innerText()) === 'Ask for price', 'new size not Ask for price')

  await page.getByLabel('Running low at (kg)').fill('2.5')
  await page.getByRole('button', { name: 'Save product' }).click()
  await page.waitForURL(/\/admin\/products$/, { timeout: 15000 })

  const p = await newestProduct('Wedding cake flour')
  assert(p.category === 'Speciality Flour' && p.baseUnit === 'kg' && p.lowStockThresholdMilli === 2500, JSON.stringify(p))
  assert(p.sellUnits.length === 2, `public sizes: ${JSON.stringify(p.sellUnits)}`)
  assert(p.sellUnits[0].label === '1 kg' && p.sellUnits[0].priceSen === 650, JSON.stringify(p.sellUnits[0]))
  assert(p.sellUnits[1].label === 'Custom blend' && p.sellUnits[1].priceSen === null && p.sellUnits[1].factorMilli === 5000, JSON.stringify(p.sellUnits[1]))
  assert(p.price === 6.5 && p.hasWholesale === true, `price ${p.price} hasWholesale ${p.hasWholesale}`)
  assert(!JSON.stringify(p).includes('13000'), 'wholesale price leaked onto the public doc')
  const priv = await getDoc('productPrivate', p.id)
  assert(priv.wholesaleUnits.length === 1 && priv.wholesaleUnits[0].priceSen === 13000, JSON.stringify(priv))
  const cat = (await db().collection('categories').where('name', '==', 'Speciality Flour').get()).docs[0]?.data()
  assert(cat?.nameZh === '特制面粉', `category doc: ${JSON.stringify(cat)}`)
  assert(p.managedStock !== true, 'editor switched stock tracking on')
})

await check('adding a category that already exists (other letter case) is refused with a clear message', async () => {
  await page.goto(`${BASE_URL}/admin/products/new`)
  await page.getByLabel('Category').selectOption('__add_new__')
  await page.getByLabel('New category (English)').fill('flour')
  await page.getByRole('button', { name: 'Add category' }).click()
  await page.getByRole('alert').filter({ hasText: '"Flour" already exists' }).waitFor()
})

await check('"Ask for price" only product: saved with no price field; the list shows "Ask for price"', async () => {
  await page.goto(`${BASE_URL}/admin/products/new`)
  await page.getByLabel('Name', { exact: true }).fill('Sugar flowers (custom)')
  await page.getByLabel('Category').selectOption('Flour')
  await page.getByRole('button', { name: 'Save product' }).click()
  await page.waitForURL(/\/admin\/products$/, { timeout: 15000 })
  const p = await newestProduct('Sugar flowers (custom)')
  assert(!('price' in p), `price field written: ${p.price}`)
  assert(p.sellUnits.length === 1 && p.sellUnits[0].priceSen === null, JSON.stringify(p.sellUnits))
  const row = page.locator('li', { hasText: 'Sugar flowers (custom)' })
  await row.waitFor()
  assert((await row.innerText()).includes('Ask for price'), await row.innerText())
})

await check('editing an old product: opens with its legacy price; a keypad change saves as sizes; featured/notes kept', async () => {
  await page.goto(`${BASE_URL}/admin/products/legacy`)
  await page.getByLabel('Name', { exact: true }).waitFor()
  assert((await page.getByLabel('Name', { exact: true }).inputValue()) === 'Bread flour 1kg', 'name not loaded')
  assert((await units().count()) === 1, 'expected the one legacy size')
  assert((await units().nth(0).getByTestId('price-button').innerText()) === 'RM 6.50', 'legacy price not shown')
  await units().nth(0).getByTestId('price-button').click()
  const display = units().nth(0).getByTestId(/-display$/)
  await display.focus()
  for (let i = 0; i < 4; i++) await page.keyboard.press('Backspace')
  await page.keyboard.type('720')
  assert((await display.innerText()).includes('7.20'), `typed price: ${await display.innerText()}`)
  await page.getByRole('button', { name: 'Save product' }).click()
  await page.waitForURL(/\/admin\/products$/, { timeout: 15000 })
  const p = await getDoc('products', 'legacy')
  assert(p.price === 7.2 && p.sellUnits[0].priceSen === 720, JSON.stringify(p))
  assert(p.featured === true && p.mentorNote === 'Sim uses this' && p.description === 'Strong flour', 'other fields lost')
})

await check('editing an old "Ask for price" product keeps it Ask for price', async () => {
  await page.goto(`${BASE_URL}/admin/products/ask-legacy`)
  await page.getByLabel('Name', { exact: true }).waitFor()
  assert((await units().nth(0).getByTestId('price-button').innerText()) === 'Ask for price', 'not Ask for price')
  await page.getByRole('button', { name: 'Save product' }).click()
  await page.waitForURL(/\/admin\/products$/, { timeout: 15000 })
  const p = await getDoc('products', 'ask-legacy')
  assert(!('price' in p) && p.sellUnits[0].priceSen === null, JSON.stringify(p))
})

await check('managed product: unit locked, stock numbers shown, no In-stock checkbox', async () => {
  await page.goto(`${BASE_URL}/admin/products/${rice}`)
  await page.getByTestId('stock-managed').waitFor()
  assert(await page.getByLabel('Counted in').isDisabled(), 'base unit editable on a managed product')
  await page.getByTestId('stock-managed').filter({ hasText: 'On the shelf 10 kg' }).waitFor()
  assert((await page.getByLabel('In stock (shown to customers)').count()) === 0, 'manual in-stock shown for managed')
})

await check('products list: managed products show their status (no toggle); In stock toggle works on an Ask-for-price product', async () => {
  await page.goto(`${BASE_URL}/admin/products`)
  const riceRow = page.locator('li', { hasText: 'Rice flour' })
  await riceRow.getByTestId('managed-status').waitFor()
  assert((await riceRow.getByRole('button').count()) === 0, 'toggle shown for a managed product')
  const askRow = page.locator('li', { hasText: 'Cake topper' })
  await askRow.getByRole('button', { name: 'In stock' }).click()
  await waitForDoc('products', 'ask-legacy', (p) => p.inStock === false)
})

console.log('\n--- "Ask for price" with managed stock (API) ---')

let askManaged
await check('server refuses changing the unit of a managed product', async () => {
  const r = await api('PUT', `/api/admin/products/${rice}`, {
    name: 'Rice flour', category: 'Flour', baseUnit: 'g', lowStockThresholdMilli: 1000, trackExpiry: false, barcodes: [],
    sellUnits: [{ id: 'kg1', label: '1 kg', factorMilli: 1000, priceSen: 650, channel: 'both' }],
  })
  assert(r.status === 409 && /managed in kg/.test(r.json.error), `${r.status} ${r.json.error}`)
  assert((await getDoc('products', rice)).baseUnit === 'kg', 'unit changed')
})

await check('an "Ask for price" product can be switched to managed stock', async () => {
  askManaged = await createProduct(api, {
    name: 'Fondant (custom colour)', category: 'Decorations', baseUnit: 'kg', lowStockThresholdMilli: 1000, trackExpiry: false, barcodes: [],
    sellUnits: [{ id: 'kg1', label: '1 kg', factorMilli: 1000, priceSen: null, channel: 'both' }],
  })
  await switchOn(api, askManaged, 3000)
  const p = await getDoc('products', askManaged)
  assert(p.managedStock === true && p.stockStatus === 'in_stock' && !('price' in p), JSON.stringify(p))
})

await check('ordering more than is available is refused even though it has no price', async () => {
  const [r] = await placeOrders([[{ productId: askManaged, sellUnitId: 'kg1', qty: 4 }]])
  assert(r.status === 409 && /enough Fondant/.test(r.json.error), `${r.status} ${r.json.error}`)
})

await check('an order within stock is accepted (price to confirm); confirm holds it; collect deducts it', async () => {
  const [r] = await placeOrders([[{ productId: askManaged, sellUnitId: 'kg1', qty: 2 }]])
  assert(r.status === 201 && r.json.priceToConfirm === true && r.json.estimatedTotal === 0, `${r.status} ${JSON.stringify(r.json)}`)
  const id = r.json.orderId
  const c = await api('POST', `/api/admin/orders/${id}/transition`, { to: 'confirmed', confirmedTotalSen: 4000 })
  assert(c.status === 200, `${c.status} ${c.json.error}`)
  assert((await getDoc('inventory', askManaged)).reservedMilli === 2000, 'not held')
  for (const to of ['paid', 'ready', 'collected']) await api('POST', `/api/admin/orders/${id}/transition`, { to })
  const i = await getDoc('inventory', askManaged)
  assert(i.onHandMilli === 1000 && i.reservedMilli === 0, JSON.stringify(i))
  assert((await getDoc('products', askManaged)).stockStatus === 'low', 'status not low at 1 kg')
})

await check('confirming more than is left is refused for an "Ask for price" product too', async () => {
  // Both orders fit on their own (1 kg left); only one can be held.
  const [r, r2] = await placeOrders([[{ productId: askManaged, sellUnitId: 'kg1', qty: 1 }], [{ productId: askManaged, sellUnitId: 'kg1', qty: 1 }]])
  assert(r.status === 201 && r2.status === 201, `orders ${r.status}/${r2.status}`)
  await api('POST', `/api/admin/orders/${r.json.orderId}/transition`, { to: 'confirmed', confirmedTotalSen: 2000 })
  const c = await api('POST', `/api/admin/orders/${r2.json.orderId}/transition`, { to: 'confirmed', confirmedTotalSen: 2000 })
  assert(c.status === 409 && /Fondant/.test(c.json.error), `${c.status} ${c.json.error}`)
})

await check('no uncaught page errors', async () => {
  await sleep(100)
  assert(pageErrors.length === 0, pageErrors.join(' | '))
})

await browser.close()
process.exit(summary() ? 1 : 0)
