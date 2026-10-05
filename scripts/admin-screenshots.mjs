// Admin screenshots for phase reports, against the emulator. Run inside
// scripts/test-env.sh:  bash scripts/test-env.sh node scripts/admin-screenshots.mjs <outDir>
import { mkdirSync } from 'fs'
import { chromium } from 'playwright'
import { BASE_URL, db, resetEmulators, createAdmin } from './lib/emu.mjs'
import { seedOrders } from './fixtures/orders.mjs'

const out = process.argv[2] || '/tmp/sbh-shots/admin'
mkdirSync(out, { recursive: true })

await resetEmulators()
const owner = await createAdmin('sim@simbakinghouse.test')
await seedOrders(db())
const names = ['Bread flour 1kg', 'Cake tin 8in', 'Butter cake premix', 'Rice flour 500g', 'Piping bags (50)', 'Cocoa powder 250g']
for (const [i, name] of names.entries()) {
  await db().collection('products').doc(`p${i}`).set({ name, price: 4.5 + i * 3, category: i % 2 ? 'Tools' : 'Ingredients', inStock: i !== 3 })
}

const browser = await chromium.launch()
for (const [w, h, label] of [[390, 844, '390'], [1440, 900, '1440']]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: w < 800, hasTouch: w < 800 })
  const page = await ctx.newPage()
  const shot = async (name) => {
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${out}/${name}-${label}.png` })
  }

  await page.goto(`${BASE_URL}/admin/login`)
  await shot('login')
  await page.fill('#email', owner.email)
  await page.fill('#password', owner.password)
  await page.click('button[type=submit]')
  await page.locator('[data-testid=order-list]').waitFor({ timeout: 20000 })
  await shot('orders-active')
  await page.getByRole('tab', { name: 'All', exact: true }).click()
  await page.locator('[data-testid=order-list] a[data-order-id="OLD-10"]').waitFor({ timeout: 20000 })
  await shot('orders-all')
  await page.goto(`${BASE_URL}/admin/orders/OLD-02`)
  await page.getByRole('heading', { name: 'OLD-02' }).waitFor({ timeout: 20000 })
  await shot('order-old-format')
  await page.goto(`${BASE_URL}/admin/orders/SBH-0101`)
  await page.getByRole('heading', { name: 'SBH-0101' }).waitFor({ timeout: 20000 })
  await shot('order-new')
  await page.goto(`${BASE_URL}/admin/products`)
  await page.getByText('Bread flour 1kg').waitFor({ timeout: 20000 })
  await shot('products')
  await page.evaluate(() => localStorage.setItem('__sbhFault', 'orders-query'))
  await page.goto(`${BASE_URL}/admin`)
  await page.getByText('Could not load orders.').waitFor({ timeout: 20000 })
  await shot('orders-error')
  await page.evaluate(() => localStorage.removeItem('__sbhFault'))
  await ctx.close()
}
await browser.close()
console.log(`saved to ${out}`)
