// iPad-first admin v2 (emulator only): the shared SBH Inventory stock system
// written from the web (receive, FEFO on collect, holds, wastage, recount),
// server-side sale pricing, and the new admin screens (sidebar, dashboard,
// stock manager, split-view orders, sale events, shop-login redirect).
import { mkdirSync } from 'fs'
import { webkit } from 'playwright'
import { BASE_URL, db, createAdmin, check, assert, summary } from './lib/emu.mjs'
import { apiAs, createProduct, placeOrders, loginAdmin, getDoc, sleep, isCancelledRequestNoise } from './lib/phase2.mjs'

const SHOTS = process.env.SHOTS_DIR || '.screenshots/admin-v2'
mkdirSync(SHOTS, { recursive: true })
const d = db()
const sim = await createAdmin('sim-v2@sbh.test', 'owner')
const api = apiAs(sim.email)
const klDay = (offset = 0) => new Date(Date.now() + 8 * 3600_000 + offset * 86400_000).toISOString().slice(0, 10)
const unit = (id, label, priceSen) => ({ id, label, factorMilli: 1000, priceSen, channel: 'both' })
const base = { description: '', imageUrl: '', inStock: true, baseUnit: 'pc', lowStockThresholdMilli: 5000, trackExpiry: true, barcodes: [] }
const butter = await createProduct(api, { ...base, name: 'Anchor butter 227g', category: 'Dairy', sellUnits: [unit('pc', '1 block', 1380)] })
const flour = await createProduct(api, { ...base, name: 'AP flour 1kg', category: 'Flour', sellUnits: [unit('pc', '1 kg', 450)] })
const premix = await createProduct(api, { ...base, name: 'Butter cake premix', category: 'Premix', sellUnits: [unit('pc', '500 g', 1290)] })
const level = async (id) => (await getDoc('stockLevels', `${id}_storeroom`)) ?? {}
const batchesOf = async (id) => (await d.collection('batches').where('productId', '==', id).get()).docs.map((x) => ({ id: x.id, ...x.data() }))
const ledger = async (type, id) => (await d.collection('stockMovements').where('productId', '==', id).where('type', '==', type).get()).docs.map((x) => x.data())
const step = (orderId, to, extra = {}) => api('POST', `/api/admin/orders/${orderId}/transition`, { to, ...extra })

let soonBatch, lateBatch
await check('receive two butter batches: new batches with expiry/supplier/cost, receive entries, level, latest cost (same records as the iPad)', async () => {
  let r = await api('POST', '/api/admin/inventory/receive', { productId: butter, qtyMilli: 3000, unitCostSen: 1100, supplierName: 'Anchor Malaysia', expiryDate: klDay(10) })
  assert(r.status === 200, JSON.stringify(r.json))
  soonBatch = r.json.batchId
  r = await api('POST', '/api/admin/inventory/receive', { productId: butter, qtyMilli: 11000, unitCostSen: 1120, supplierName: 'Local Distributor', expiryDate: klDay(100) })
  lateBatch = r.json.batchId
  const lv = await level(butter)
  assert(lv.onHandMilli === 14000 && lv.reservedMilli === 0, JSON.stringify(lv))
  const b = await getDoc('batches', soonBatch)
  assert(b.qtyMilli === 3000 && b.expiryDate === klDay(10) && b.supplierName === 'Anchor Malaysia' && b.locationId === 'storeroom', JSON.stringify(b))
  assert((await getDoc('batchCosts', lateBatch)).unitCostSen === 1120, 'batch cost')
  assert((await getDoc('productCosts', butter)).costPerUnitSen === 1120, 'latest cost')
  assert((await ledger('receive', butter)).length === 2, 'receive ledger')
  assert((await d.collection('receipts').get()).size === 2, 'receipt records')
  r = await api('POST', '/api/admin/inventory/receive', { productId: butter, qtyMilli: 0 })
  assert(r.status === 400, 'zero refused')
})

await check('stock list: butter 14 pcs, batches soonest expiry first, flagged expiring; cost and sell price', async () => {
  const r = await api('GET', '/api/admin/inventory')
  const row = r.json.rows.find((x) => x.id === butter)
  assert(row.onHandMilli === 14000 && row.batches.map((b) => b.id).join() === `${soonBatch},${lateBatch}`, JSON.stringify(row))
  assert(row.latestCostSen === 1120 && row.sellPriceSen === 1380, JSON.stringify(row))
})

let orderA
await check('order confirm holds stock (online_reserve, inv reserved); collect takes it off the soonest batch first and releases the hold', async () => {
  const [o] = await placeOrders([[{ productId: butter, qty: 4 }]])
  assert(o.status === 201, JSON.stringify(o.json))
  orderA = o.json.orderId
  let r = await step(orderA, 'confirmed', { confirmedTotalSen: 5520 })
  assert(r.status === 200, JSON.stringify(r.json))
  let lv = await level(butter)
  assert(lv.onHandMilli === 14000 && lv.reservedMilli === 4000, JSON.stringify(lv))
  assert((await getDoc('orders', orderA)).inv.state === 'reserved', 'inv reserved')
  assert((await ledger('online_reserve', butter)).length === 1, 'reserve ledger')
  for (const to of ['paid', 'ready', 'collected']) {
    r = await step(orderA, to)
    assert(r.status === 200, `${to}: ${JSON.stringify(r.json)}`)
  }
  lv = await level(butter)
  assert(lv.onHandMilli === 10000 && lv.reservedMilli === 0, JSON.stringify(lv))
  assert((await getDoc('batches', soonBatch)).qtyMilli === 0 && (await getDoc('batches', lateBatch)).qtyMilli === 10000, 'FEFO')
  const sales = await ledger('online_sale', butter)
  assert(sales.length === 2 && sales.some((s) => s.batchId === soonBatch && s.qtyDeltaMilli === -3000) && sales.some((s) => s.batchId === lateBatch && s.qtyDeltaMilli === -1000), JSON.stringify(sales))
  assert((await getDoc('orders', orderA)).inv.state === 'collected', 'inv collected')
  r = await step(orderA, 'collected')
  assert(r.status === 200 && r.json.unchanged === true, 'repeat is a no-op')
  assert((await level(butter)).onHandMilli === 10000, 'not deducted twice')
})

await check('cancel releases the hold (online_release); an order the iPad holds can be stepped on the web now', async () => {
  const [o, ipad] = await placeOrders([[{ productId: butter, qty: 2 }], [{ productId: flour, qty: 1 }]])
  await step(o.json.orderId, 'confirmed', { confirmedTotalSen: 2760 })
  assert((await level(butter)).reservedMilli === 2000, 'held')
  const r = await step(o.json.orderId, 'cancelled', { cancelReason: 'customer changed mind' })
  assert(r.status === 200, JSON.stringify(r.json))
  assert((await level(butter)).reservedMilli === 0 && (await getDoc('orders', o.json.orderId)).inv.state === 'released', 'released')
  // Confirmed on the iPad: status confirmed + inv hold already written there.
  await d.collection('orders').doc(ipad.json.orderId).update({ status: 'confirmed', inv: { state: 'reserved', locationId: 'storeroom', lines: [{ productId: flour, qtyMilli: 1000 }] } })
  await d.collection('stockLevels').doc(`${flour}_storeroom`).set({ productId: flour, locationId: 'storeroom', onHandMilli: 5000, reservedMilli: 1000 })
  for (const to of ['paid', 'ready', 'collected']) {
    const s = await step(ipad.json.orderId, to)
    assert(s.status === 200, `${to}: ${JSON.stringify(s.json)}`)
  }
  const lv = await level(flour)
  assert(lv.onHandMilli === 4000 && lv.reservedMilli === 0, JSON.stringify(lv))
})

await check('adjust: damaged off a chosen batch (wastage); recount to a number (count_adjust, product marked counted)', async () => {
  let r = await api('POST', '/api/admin/inventory/adjust', { mode: 'wastage', batchId: lateBatch, qtyMilli: 1000, reason: 'damaged' })
  assert(r.status === 200, JSON.stringify(r.json))
  assert((await getDoc('batches', lateBatch)).qtyMilli === 9000 && (await level(butter)).onHandMilli === 9000, 'wastage')
  r = await api('POST', '/api/admin/inventory/adjust', { mode: 'wastage', batchId: lateBatch, qtyMilli: 99000, reason: 'damaged' })
  assert(r.status === 400, 'more than the batch refused')
  r = await api('POST', '/api/admin/inventory/adjust', { mode: 'recount', productId: butter, countedMilli: 8000 })
  assert(r.status === 200, JSON.stringify(r.json))
  assert((await level(butter)).onHandMilli === 8000, 'recount')
  assert((await ledger('count_adjust', butter)).length === 1, 'count entry')
  assert((await getDoc('products', butter)).openingCount?.done === true, 'counted')
})

await check('sale pricing happens on the server: badge % off, mix & match and spend threshold on the order', async () => {
  const promos = [
    { id: 'clr', name: 'Butter Clearance', active: true, type: 'PRODUCT_BADGE', badgeConfig: { badgeTextEn: 'CLEARANCE', badgeTextZh: '清仓', badgeColor: 'red', productIds: [butter], discountPercent: 20 } },
    { id: 'mm', name: '2 for RM16', active: true, type: 'MIX_AND_MATCH', mixMatchConfig: { eligibleProductIds: [flour, premix], requiredQty: 2, bundlePriceSen: 1600, promptTextEn: 'Add {remaining} more!', promptTextZh: '再加 {remaining} 件！' } },
    { id: 'sp', name: 'Spend RM30 save RM3', active: true, type: 'SPEND_THRESHOLD', thresholdConfig: { minSpendSen: 3000, discountSen: 300, upsellThresholdSen: 2000 } },
  ]
  let r = await api('PUT', '/api/admin/promotions', { promos })
  assert(r.status === 200, JSON.stringify(r.json))
  r = await api('PUT', '/api/admin/promotions', { promos: [{ ...promos[0], badgeConfig: { ...promos[0].badgeConfig, productIds: [] } }] })
  assert(r.status === 400, 'invalid sale refused')
  // butter 2 x 1380 -> 20% off = 2 x 1104 (552 off); flour 450 + premix 1290 = 1740 -> 1600 (140 off);
  // after: 2208 + 1600 = 3808 >= 3000 -> 300 off. Total 4500 - 992 = 3508.
  const [o] = await placeOrders([[{ productId: butter, qty: 2 }, { productId: flour, qty: 1 }, { productId: premix, qty: 1 }]])
  assert(o.status === 201, JSON.stringify(o.json))
  const order = await getDoc('orders', o.json.orderId)
  assert(order.estimatedTotalSen === 3508 && order.promo.subtotalSen === 4500 && order.promo.totalDiscountSen === 992, JSON.stringify(order.promo))
  assert(order.promo.discounts.map((x) => `${x.promoId}:${x.discountSen}`).join() === 'clr:552,mm:140,sp:300', JSON.stringify(order.promo.discounts))
  await api('PUT', '/api/admin/promotions', { promos: [] })
})

const browser = await webkit.launch()
const pageErrors = []
async function newPage(viewport, opts = {}) {
  const ctx = await browser.newContext({ viewport, ...opts })
  await ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (r) => r.abort())
  const page = await ctx.newPage()
  page.on('pageerror', (e) => {
    if (!isCancelledRequestNoise(e.message) && !/access control checks|Load failed/.test(e.message)) pageErrors.push(`${page.url()}: ${e.message}`)
  })
  return page
}

const ipad = await newPage({ width: 1180, height: 820 }, { hasTouch: true })
await loginAdmin(ipad, sim.email)

await check('iPad: left sidebar (Home, Orders, Stock & Batches, Products, Sale Events, Settings) with live badges; store status pill', async () => {
  await placeOrders([[{ productId: flour, qty: 1 }]]) // a new order to act on
  await ipad.goto(`${BASE_URL}/admin`)
  const bar = ipad.getByTestId('admin-sidebar')
  await bar.waitFor()
  for (const n of ['Home', 'Orders', 'Stock & Batches', 'Products', 'Sale Events', 'Settings', 'View Live Shop']) {
    await bar.getByRole('link', { name: new RegExp(`^${n.replace('&', '\\&')}`) }).first().waitFor()
  }
  await bar.getByRole('button', { name: 'Sign Out' }).waitFor()
  await bar.getByTestId('badge-orders').waitFor({ timeout: 15000 })
  await bar.getByTestId('badge-stock').waitFor()
  await bar.getByTestId('store-status').waitFor()
  const w = await bar.boundingBox()
  assert(Math.round(w.width) === 220, `sidebar ${w.width}px`)
  const links = await bar.locator('nav a').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))
  assert(links.every((h) => h >= 48), `touch targets ${links.join(',')}`)
})

await check('iPad dashboard: 4 stat cards, live queue with the new order, expiring batches, low stock; Confirm & WhatsApp holds stock', async () => {
  for (const id of ['stat-action', 'stat-revenue', 'stat-expiring', 'stat-low', 'fulfilment-queue', 'expiring-list', 'low-list']) await ipad.getByTestId(id).waitFor()
  const card = ipad.getByTestId('queue-order').filter({ hasText: 'AP flour 1kg' }).filter({ has: ipad.getByTestId('queue-confirm') }).first()
  await card.waitFor()
  await ipad.screenshot({ path: `${SHOTS}/dashboard-1180.png`, fullPage: true })
  const orderId = (await card.locator('a').first().innerText()).trim()
  const popup = ipad.context().waitForEvent('page').catch(() => null)
  await card.getByTestId('queue-confirm').click()
  await popup
  let o
  for (let i = 0; i < 40; i++) {
    o = await getDoc('orders', orderId)
    if (o.status === 'confirmed') break
    await sleep(250)
  }
  assert(o.status === 'confirmed' && o.inv?.state === 'reserved' && o.confirmedTotalSen === o.estimatedTotalSen, JSON.stringify({ s: o.status, inv: o.inv }))
})

await check('iPad stock manager: quick filter Expiring, batch pills, + Receive batch through the dialog', async () => {
  // A batch that expires soon, so the filter has something to show.
  await api('POST', '/api/admin/inventory/receive', { productId: premix, qtyMilli: 2000, unitCostSen: 900, supplierName: 'Premix Co', expiryDate: klDay(5) })
  await ipad.goto(`${BASE_URL}/admin/stock`)
  await ipad.getByTestId('stock-rows').waitFor()
  await ipad.getByTestId('quick-expiring').click()
  const rows = ipad.getByTestId('stock-row')
  await rows.filter({ hasText: 'Butter cake premix' }).first().waitFor()
  assert(!(await rows.filter({ hasText: 'AP flour 1kg' }).count()), 'flour is not expiring')
  assert((await rows.filter({ hasText: 'Butter cake premix' }).first().getByTestId('batch-pills').innerText()).includes('⚠️'), 'expiry warning')
  await ipad.getByTestId('quick-all').click()
  await rows.filter({ hasText: 'AP flour 1kg' }).first().getByTestId('row-receive').click()
  const dlg = ipad.getByTestId('receive-dialog')
  await dlg.getByLabel(/Quantity/).fill('20')
  await dlg.getByLabel(/Cost per/).fill('3.10')
  await dlg.getByLabel('Supplier').fill('FFM Berhad')
  await dlg.getByLabel(/Expiry date/).fill(klDay(180))
  await ipad.screenshot({ path: `${SHOTS}/receive-dialog-1180.png` })
  await dlg.getByRole('button', { name: 'Receive batch' }).click()
  await dlg.waitFor({ state: 'detached' })
  const fb = (await batchesOf(flour)).find((b) => b.supplierName === 'FFM Berhad')
  assert(fb && fb.qtyMilli === 20000 && fb.expiryDate === klDay(180), JSON.stringify(fb))
  await ipad.screenshot({ path: `${SHOTS}/stock-1180.png`, fullPage: true })
})

await check('iPad orders: master–detail split view (list left, selected order right)', async () => {
  await ipad.goto(`${BASE_URL}/admin/orders`)
  await ipad.getByTestId('order-list').waitFor({ timeout: 15000 })
  await ipad.getByTestId('order-split-detail').getByTestId('order-detail').waitFor()
  const second = ipad.getByTestId('order-list').locator('a').nth(1)
  if (await second.count()) {
    const id = await second.getAttribute('data-order-id')
    await second.click()
    await ipad.getByTestId('order-split-detail').getByRole('heading', { name: id }).waitFor()
    assert(ipad.url().endsWith('/admin/orders'), 'stayed on the list')
  }
  await ipad.screenshot({ path: `${SHOTS}/orders-split-1180.png` })
})

await check('iPad sale events: create a badge sale from the template, then switch it off with one tap', async () => {
  await ipad.goto(`${BASE_URL}/admin/promos`)
  await ipad.getByTestId('template-PRODUCT_BADGE').click()
  const ed = ipad.getByTestId('promo-editor')
  await ed.getByLabel('Sale name').fill('Butter Clearance')
  await ed.getByLabel('Badge text', { exact: true }).fill('CLEARANCE')
  await ed.getByLabel('Badge text (中文)').fill('清仓特价')
  await ed.getByLabel(/% off/).fill('15')
  await ed.getByTestId('badge-products').getByLabel('Search products').fill('anchor')
  await ed.getByTestId('badge-products').getByRole('checkbox').first().check()
  await ed.getByRole('button', { name: 'Save sale' }).click()
  await ipad.getByTestId('promo-row').filter({ hasText: 'Butter Clearance' }).waitFor()
  let doc = await getDoc('settings', 'promotions')
  assert(doc.promos.length === 1 && doc.promos[0].badgeConfig.productIds[0] === butter && doc.promos[0].badgeConfig.discountPercent === 15 && doc.promos[0].active === true, JSON.stringify(doc))
  await ipad.screenshot({ path: `${SHOTS}/promos-1180.png` })
  await ipad.getByTestId('promo-toggle').first().click()
  await ipad.getByText('Butter Clearance is off.').waitFor()
  doc = await getDoc('settings', 'promotions')
  assert(doc.promos[0].active === false, 'toggled off')
})

await check('phone: menu button opens the same sections; no sideways scroll', async () => {
  const phone = await newPage({ width: 390, height: 844 }, { isMobile: true, hasTouch: true })
  await loginAdmin(phone, sim.email)
  await phone.goto(`${BASE_URL}/admin`)
  await phone.getByRole('button', { name: 'Open admin menu' }).click()
  const menu = phone.getByRole('dialog', { name: 'Admin menu' })
  await menu.getByText('Stock & Batches').click()
  await phone.waitForURL(/\/admin\/stock$/)
  const r = await phone.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: document.documentElement.clientWidth }))
  assert(r.sw <= r.w + 1, `${r.sw} > ${r.w}`)
  await phone.screenshot({ path: `${SHOTS}/stock-390.png`, fullPage: true })
  await phone.context().close()
})

await check('an admin who signs in from the shop goes to the admin', async () => {
  const page = await newPage({ width: 1280, height: 900 })
  await page.goto(`${BASE_URL}/`)
  await page.locator('header').getByRole('button', { name: /account|sign in/i }).first().click()
  await page.locator('input[type=email]').fill(sim.email)
  await page.locator('input[type=password]').fill('test-password-123')
  await page.locator('form').getByRole('button', { name: /^sign in$/i }).click()
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 20000 })
  await page.context().close()
})

await check('no uncaught page errors', async () => {
  assert(pageErrors.length === 0, pageErrors.join(' | '))
})

await browser.close()
process.exit(summary() ? 1 : 0)
