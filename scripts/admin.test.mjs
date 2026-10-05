// Admin E2E against the emulator. Run inside scripts/test-env.sh:
//   bash scripts/test-env.sh node scripts/admin.test.mjs
import { chromium } from 'playwright'
import { BASE_URL, db, resetEmulators, createAdmin, createUser, check, assert, summary } from './lib/emu.mjs'
import { seedOrders } from './fixtures/orders.mjs'

await resetEmulators()
const owner = await createAdmin('owner@test.local') // legacy doc, no role field
const stranger = await createUser('customer@test.local')
await seedOrders(db())
await db().collection('products').doc('flour').set({ name: 'Bread flour 1kg', price: 6.5, category: 'Flour', inStock: true })
await db().collection('products').doc('tin').set({ name: 'Cake tin 8in', price: 18, category: 'Tools', inStock: true })

const EXPECT = {
  Active: ['SBH-0101', 'SBH-0102', 'SBH-0103', 'SBH-0104'],
  New: ['SBH-0101'],
  Confirmed: ['SBH-0102'],
  Paid: ['SBH-0103'],
  Ready: ['SBH-0104'],
  Collected: ['SBH-0105', 'OLD-03', 'OLD-09'],
  Cancelled: ['SBH-0106', 'OLD-01', 'OLD-02', 'OLD-04', 'OLD-08', 'OLD-10'],
  All: ['SBH-0101', 'SBH-0102', 'SBH-0103', 'SBH-0104', 'SBH-0105', 'SBH-0106',
    'OLD-01', 'OLD-02', 'OLD-03', 'OLD-04', 'OLD-05', 'OLD-06', 'OLD-07', 'OLD-08', 'OLD-09', 'OLD-10'],
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))

async function login(email, password = 'test-password-123') {
  await page.goto(`${BASE_URL}/admin/login`)
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type=submit]')
}
async function visibleOrderIds() {
  return page.$$eval('[data-testid=order-list] a[data-order-id]', (as) => as.map((a) => a.getAttribute('data-order-id')))
}
async function waitForOrdersSettled() {
  await page.waitForFunction(
    () => document.querySelector('[data-testid=order-list]') || /No orders here|Could not load/.test(document.body.innerText),
    null,
    { timeout: 15000 }
  )
}
const crashed = async () => (await page.getByText('Application error').count()) > 0

console.log('--- Access ---')

await check('signed out: /admin redirects to /admin/login', async () => {
  await page.goto(`${BASE_URL}/admin`)
  await page.waitForURL(/\/admin\/login/, { timeout: 15000 })
})

await check('login page offers Google and email/password, and loads no customer site chrome', async () => {
  await page.goto(`${BASE_URL}/admin/login`)
  assert(await page.getByRole('button', { name: 'Sign in with Google' }).count(), 'no Google button')
  assert(await page.locator('#email').count(), 'no email field')
  assert(!(await page.getByText('Sim · Baking · House').count()), 'customer header present')
  assert(!(await page.locator('[aria-label^="Cart,"]').count()), 'cart button present')
})

await check('non-admin: sees "not an admin" with their UID, and is signed out', async () => {
  await login(stranger.email)
  await page.getByText('This account is not an admin.').waitFor({ timeout: 15000 })
  const uid = (await page.getByTestId('rejected-uid').innerText()).trim()
  assert(uid === stranger.uid, `shown UID ${uid} != ${stranger.uid}`)
  await page.goto(`${BASE_URL}/admin`)
  await page.waitForURL(/\/admin\/login/, { timeout: 15000 })
})

await check('admin (legacy doc, no role): signs in straight to /admin', async () => {
  await login(owner.email)
  await page.waitForURL(`${BASE_URL}/admin`, { timeout: 15000 })
  await waitForOrdersSettled()
})

await check('already signed in: /admin/login goes straight back to /admin', async () => {
  await page.goto(`${BASE_URL}/admin/login`)
  await page.waitForURL(`${BASE_URL}/admin`, { timeout: 15000 })
})

console.log('\n--- Orders: every filter tab, with old-format orders seeded ---')

for (const [label, expected] of Object.entries(EXPECT)) {
  await check(`tab "${label}" renders without crashing and lists exactly ${expected.length} order(s)`, async () => {
    pageErrors.length = 0
    await page.getByRole('tab', { name: label, exact: true }).click()
    await page.waitForTimeout(300)
    await waitForOrdersSettled()
    assert(!(await crashed()), 'Application error shown')
    assert(pageErrors.length === 0, `page error: ${pageErrors[0]}`)
    const ids = await visibleOrderIds()
    const missing = expected.filter((id) => !ids.includes(id))
    const extra = ids.filter((id) => !expected.includes(id))
    assert(!missing.length && !extra.length, `missing [${missing}] extra [${extra}]`)
  })
}

console.log('\n--- Old-format order detail pages ---')

for (const id of ['OLD-01', 'OLD-02', 'OLD-03', 'OLD-04', 'OLD-07', 'OLD-09', 'OLD-10']) {
  await check(`order ${id} opens without crashing`, async () => {
    pageErrors.length = 0
    await page.goto(`${BASE_URL}/admin/orders/${id}`)
    await page.getByRole('heading', { name: id }).waitFor({ timeout: 15000 })
    assert(!(await crashed()), 'Application error shown')
    assert(pageErrors.length === 0, `page error: ${pageErrors[0]}`)
  })
}

console.log('\n--- Failure handling ---')

await check('failed orders query shows "Could not load orders" + Retry, and Retry recovers', async () => {
  await page.goto(`${BASE_URL}/admin`)
  await page.evaluate(() => localStorage.setItem('__sbhFault', 'orders-query'))
  await page.reload()
  await page.getByText('Could not load orders.').waitFor({ timeout: 15000 })
  assert(await page.getByRole('navigation', { name: 'Admin sections' }).isVisible(), 'tab bar gone')
  await page.evaluate(() => localStorage.removeItem('__sbhFault'))
  await page.getByRole('button', { name: 'Retry' }).click()
  await page.locator('[data-testid=order-list]').waitFor({ timeout: 15000 })
  assert((await visibleOrderIds()).length > 0, 'no orders after retry')
})

await check('a page that throws shows the error boundary; the rest of admin keeps working', async () => {
  await page.evaluate(() => localStorage.setItem('__sbhFault', 'render-orders'))
  await page.reload()
  await page.getByText('Could not load this page.').waitFor({ timeout: 15000 })
  assert(!(await crashed()), 'whole app crashed instead')
  await page.getByRole('navigation', { name: 'Admin sections' }).getByRole('link', { name: 'Products' }).click()
  await page.getByRole('heading', { name: 'Products' }).waitFor({ timeout: 15000 })
  await page.evaluate(() => localStorage.removeItem('__sbhFault'))
})

console.log('\n--- Layout, noindex, manifest ---')

await check('admin pages: no customer header/footer/cart; bottom tabs Orders/Products/Stock/Settings', async () => {
  await page.goto(`${BASE_URL}/admin`)
  await waitForOrdersSettled()
  assert(!(await page.getByText('Sim · Baking · House').count()), 'customer header present')
  assert(!(await page.locator('footer#find-us').count()), 'customer footer present')
  assert(!(await page.locator('[aria-label^="Cart,"]').count()), 'cart present')
  const tabs = await page.getByRole('navigation', { name: 'Admin sections' }).getByRole('link').allInnerTexts()
  assert(JSON.stringify(tabs.map((t) => t.trim())) === JSON.stringify(['Orders', 'Products', 'Stock', 'Settings']), `tabs: ${tabs}`)
  assert(await page.getByRole('link', { name: 'View shop' }).count(), 'no View shop link')
})

await check('every /admin page is noindex (meta tag and X-Robots-Tag header)', async () => {
  for (const path of ['/admin', '/admin/login', '/admin/products', '/admin/manifest.webmanifest']) {
    const res = await fetch(`${BASE_URL}${path}`)
    assert(/noindex/.test(res.headers.get('x-robots-tag') || ''), `${path}: no X-Robots-Tag`)
  }
  const robots = await page.locator('meta[name=robots]').getAttribute('content')
  assert(/noindex/.test(robots || ''), `meta robots: ${robots}`)
})

await check('admin manifest: "SBH Admin", scope /admin, linked from admin pages only', async () => {
  const m = await (await fetch(`${BASE_URL}/admin/manifest.webmanifest`)).json()
  assert(m.name === 'SBH Admin' && m.scope === '/admin' && m.start_url === '/admin', JSON.stringify(m))
  const links = await page.$$eval('link[rel=manifest]', (ls) => ls.map((l) => l.getAttribute('href')))
  assert(links.length === 1 && links[0].startsWith('/admin/manifest.webmanifest'), `admin manifest links: ${links}`)
  const apple = await page.$$eval('link[rel=apple-touch-icon]', (ls) => ls.map((l) => l.getAttribute('href')))
  assert(apple.length === 1 && apple[0].startsWith('/admin/apple-icon'), `admin apple-touch-icon: ${apple}`)
})

await check('shop pages still link only the shop manifest and shop icons', async () => {
  const html = await (await fetch(`${BASE_URL}/privacy`)).text()
  const manifests = [...html.matchAll(/<link rel="manifest" href="([^"]+)"/g)].map((m) => m[1])
  const apple = [...html.matchAll(/<link rel="apple-touch-icon" href="([^"]+)"/g)].map((m) => m[1])
  assert(manifests.length === 1 && manifests[0] === '/manifest.webmanifest', `shop manifests: ${manifests}`)
  assert(apple.length === 1 && apple[0].startsWith('/apple-icon.png'), `shop apple icons: ${apple}`)
  const m = await (await fetch(`${BASE_URL}/manifest.webmanifest`)).json()
  assert(m.name === 'Sim Baking House' && m.scope === '/', JSON.stringify(m))
})

console.log('\n--- Products: loaded once per session ---')

await check('products list loads and client search filters it', async () => {
  await page.getByRole('navigation', { name: 'Admin sections' }).getByRole('link', { name: 'Products' }).click()
  await page.getByText('Bread flour 1kg').waitFor({ timeout: 15000 })
  await page.fill('input[type=search]', 'tin')
  assert(await page.getByText('Cake tin 8in').isVisible(), 'tin not shown')
  assert(!(await page.getByText('Bread flour 1kg').count()), 'flour not filtered out')
})

await check('returning to Products in the same session reads 0 product docs', async () => {
  await page.getByRole('navigation', { name: 'Admin sections' }).getByRole('link', { name: 'Orders' }).click()
  await waitForOrdersSettled()
  await page.waitForTimeout(500)
  const before = await page.evaluate(() => window.__fsReads ?? 0)
  await page.getByRole('navigation', { name: 'Admin sections' }).getByRole('link', { name: 'Products' }).click()
  await page.getByText('Bread flour 1kg').waitFor({ timeout: 15000 })
  await page.waitForTimeout(800)
  const after = await page.evaluate(() => window.__fsReads ?? 0)
  assert(after === before, `reads went ${before} → ${after}`)
})

await check('sign out returns to the login page', async () => {
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.waitForURL(/\/admin\/login/, { timeout: 15000 })
})

await browser.close()
process.exit(summary() > 0 ? 1 : 0)
