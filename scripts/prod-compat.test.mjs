// The merged website against production AS IT IS TODAY: live production
// Firestore rules, legacy-shaped products/settings, no publicCatalog, no
// invSettings, no Cloud Functions (scripts/seed-prodcompat.mjs, run before
// the build). Checks the shop and admin still work, fall back to the old
// product data, and hide new features that have no data yet.
//   npm run test:prod-compat
import { mkdirSync } from 'fs'
import { webkit } from 'playwright'
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator, getDocs, collection, getDoc, doc } from 'firebase/firestore'
import { BASE_URL, check, assert, summary, createAdmin } from './lib/emu.mjs'
import { loginAdmin, waitForDoc, getDoc as adminGetDoc, sleep } from './lib/phase2.mjs'

const SHOTS = process.env.SHOTS_DIR || '.screenshots/prod-compat'
mkdirSync(SHOTS, { recursive: true })
const browser = await webkit.launch()
const pageErrors = []
const consoleErrors = []

async function newPage(width) {
  const ctx = await browser.newContext(
    width < 800 ? { viewport: { width, height: 812 }, isMobile: true, hasTouch: true } : { viewport: { width, height: 900 } },
  )
  await ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (r) => r.abort())
  const page = await ctx.newPage()
  page.on('pageerror', (e) => {
    if (!/access control checks|Load failed/.test(e.message)) pageErrors.push(`${width}px ${page.url()}: ${e.message}`)
  })
  page.on('console', (m) => {
    if (m.type() === 'error' && /permission|PERMISSION_DENIED|insufficient/i.test(m.text())) consoleErrors.push(`${page.url()}: ${m.text()}`)
  })
  return page
}

await check('simulation is real: the emulator runs the production rules (browsers cannot read publicCatalog / invSettings)', async () => {
  const app = initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-sbh-test', apiKey: 'fake-api-key' }, 'probe')
  const fs = getFirestore(app)
  connectFirestoreEmulator(fs, '127.0.0.1', 8080)
  let denied = false
  try {
    await getDocs(collection(fs, 'publicCatalog'))
  } catch (e) {
    denied = /permission/i.test(String(e?.code || e?.message))
  }
  assert(denied, 'publicCatalog was readable: these are not the production rules')
  assert((await getDoc(doc(fs, 'products', 'legacy-ap'))).exists(), 'products not publicly readable')
})

for (const width of [375, 1440]) {
  const page = await newPage(width)

  await check(`${width}px home: hero and How to order render; empty collections hidden; "Start here" goes to Ask Sim`, async () => {
    await page.goto(`${BASE_URL}/`)
    await page.getByTestId('hero').waitFor({ timeout: 20000 })
    await page.getByTestId('how-to-order').waitFor()
    assert((await page.getByTestId('collections').count()) === 0, 'collections section shown with no data')
    assert((await page.getByTestId('hero-start').getAttribute('href')) === '#ask-sim', 'Start here points at an empty collection')
    await page.getByTestId('ask-sim').waitFor()
    assert((await page.getByTestId('language-line').count()) === 0, 'language line shown though the setting does not exist')
    assert((await page.getByText('Best sellers').count()) > 0, 'Best sellers (existing products) missing')
    await page.screenshot({ path: `${SHOTS}/home-${width}.png`, fullPage: true })
  })

  await check(`${width}px products: old product data used; no catalogue badges, no chilled tags; hidden/deleted stay hidden`, async () => {
    await page.goto(`${BASE_URL}/products`)
    await page.getByRole('heading', { name: 'All-purpose flour 1kg' }).first().waitFor({ timeout: 20000 })
    const html = await page.content()
    for (const hidden of ['Old hidden item', 'Old deleted item']) assert(!html.includes(hidden), `${hidden} listed`)
    const card = (name) => page.locator('div.group', { has: page.getByRole('heading', { name, exact: true }) }).first()
    // No publicCatalog: no In stock / Low / Ask us badges on old products.
    for (const name of ['All-purpose flour 1kg', 'Bread flour 1kg']) {
      const t = await card(name).innerText()
      assert(!/in stock|low stock|ask us/i.test(t), `${name} shows a badge without data: ${t}`)
    }
    // The old In-stock switch still drives Out of stock; old prices unchanged.
    assert(/out of stock/i.test(await card('Round cake tin 8 inch').innerText()), 'old out-of-stock switch ignored')
    assert((await card('All-purpose flour 1kg').innerText()).includes('RM 4.50'), 'legacy price')
    assert((await card('Fondant (custom colour)').innerText()).includes('Ask for price'), 'Ask for price')
    assert((await page.getByTestId('chilled-tag').count()) === 0, 'chilled tag without data')
    await page.getByTestId('product-search').fill('flour')
    await sleep(200)
    const names = await page.locator('main h3').allInnerTexts()
    assert(names.length === 2 && names.every((n) => /flour/i.test(n)), names.join('|'))
    await page.getByTestId('product-search').fill('')
  })

  await check(`${width}px 中文: product names fall back to English (no Chinese names yet)`, async () => {
    await page.evaluate(() => localStorage.setItem('sbh_lang', 'zh'))
    await page.reload()
    await page.getByRole('heading', { name: 'All-purpose flour 1kg' }).first().waitFor({ timeout: 20000 })
    await page.getByRole('heading', { name: '产品' }).waitFor()
    await page.evaluate(() => localStorage.setItem('sbh_lang', 'en'))
  })

  await check(`${width}px checkout with no invSettings: pickup and courier pickup offered; order saved; order page shows the WhatsApp step`, async () => {
    await page.goto(`${BASE_URL}/products`)
    await page.locator('div.group', { has: page.getByRole('heading', { name: 'All-purpose flour 1kg', exact: true }) }).first().click()
    await page.getByRole('button', { name: 'Add to cart' }).click()
    await page.getByRole('button', { name: 'Continue to order' }).click()
    await page.waitForURL(/\/checkout/)
    await page.getByText('Self pickup at the shop').waitFor()
    await page.getByText(/Courier pickup/).first().waitFor()
    await page.locator('#name').fill('Prod Compat')
    await page.locator('#phone').fill('012-345 6789')
    await page.locator('#collectTime').fill('09:00')
    await page.locator('form input[type=checkbox][required]').check()
    await sleep(3200)
    await page.getByRole('button', { name: 'Send order on WhatsApp' }).click()
    await page.waitForURL(/\/order\/SBH-/, { timeout: 20000 })
    const orderId = page.url().split('/order/')[1]
    await page.getByTestId('order-send-whatsapp').waitFor()
    const o = await waitForDoc('orders', orderId, () => true)
    assert(o.status === 'new' && o.items?.[0]?.productId === 'legacy-ap', JSON.stringify(o))
    await page.screenshot({ path: `${SHOTS}/order-${width}.png`, fullPage: true })
  })

  await page.context().close()
}

await check('admin (website admin doc, no role claim) under production rules: orders, products, drafts, settings, product save', async () => {
  const admin = await createAdmin('sim-prod@sbh.test')
  const page = await newPage(1440)
  await loginAdmin(page, admin.email)
  await page.goto(`${BASE_URL}/admin`)
  await page.getByText('Prod Compat').first().waitFor({ timeout: 20000 })
  await page.goto(`${BASE_URL}/admin/products`)
  await page.getByText('All-purpose flour 1kg').first().waitFor({ timeout: 20000 })
  await page.goto(`${BASE_URL}/admin/drafts`)
  await page.getByTestId('no-drafts').waitFor({ timeout: 20000 })
  await page.goto(`${BASE_URL}/admin/settings`)
  await page.getByLabel('Chilled notice (English)').waitFor({ timeout: 20000 })
  await page.getByRole('button', { name: 'Save settings' }).click()
  await page.getByText('Saved.').waitFor()
  const s = await adminGetDoc('settings', 'shop')
  assert(s.whatsappNumber === '60123456789' && s.showLanguageLine === false, JSON.stringify(s))
  await page.goto(`${BASE_URL}/admin/products/legacy-ap`)
  await page.getByLabel('Name', { exact: true }).waitFor({ timeout: 20000 })
  await page.getByRole('button', { name: 'Save product' }).click()
  await page.waitForURL(/\/admin\/products$/, { timeout: 15000 })
  const p = await adminGetDoc('products', 'legacy-ap')
  assert(p.name === 'All-purpose flour 1kg' && p.price === 4.5 && Array.isArray(p.collections) && p.chilled === false, JSON.stringify(p))
  await page.context().close()
})

await check('no uncaught page errors', async () => {
  assert(pageErrors.length === 0, pageErrors.join(' | '))
})

await check('no permission errors surfaced in the browser console', async () => {
  assert(consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '))
})

await browser.close()
process.exit(summary() ? 1 : 0)
