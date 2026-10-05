// Reproduces the admin orders-tab crash against the emulator. Run inside
// scripts/test-env.sh (DEV=1 for unminified stacks).
import { chromium } from 'playwright'
import { BASE_URL, db, resetEmulators, createAdmin } from './lib/emu.mjs'
import { seedOrders } from './fixtures/orders.mjs'

await resetEmulators()
const admin = await createAdmin('owner@test.local')
await seedOrders(db())

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const errors = []
page.on('pageerror', (err) => errors.push({ kind: 'pageerror', message: err.message, stack: err.stack }))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push({ kind: 'console', message: msg.text() })
})

await page.goto(`${BASE_URL}/admin/login`)
await page.fill('#email', admin.email)
await page.fill('#password', admin.password)
await page.click('button[type=submit]')
await page.waitForURL(`${BASE_URL}/admin`, { timeout: 30000 })
await page.waitForTimeout(1500)

for (const label of ['New', 'Confirmed', 'Paid', 'Ready', 'Collected', 'Cancelled', 'All']) {
  errors.length = 0
  const btn = page.getByRole('button', { name: label, exact: true })
  if (!(await btn.count())) {
    console.log(`[${label}] tab button not found — page probably already crashed`)
    continue
  }
  await btn.click()
  await page.waitForTimeout(1500)
  const crashed = await page.getByText('Application error').count()
  console.log(`[${label}] crashed=${crashed > 0} errors=${errors.length}`)
  for (const e of errors) {
    console.log(`  ${e.kind}: ${e.message}`)
    if (e.stack) console.log(e.stack.split('\n').slice(0, 8).map((l) => '    ' + l).join('\n'))
  }
  if (crashed) {
    await page.screenshot({ path: `/tmp/sbh-shots/admin-crash-${label}.png` })
    await page.goto(`${BASE_URL}/admin`)
    await page.waitForTimeout(1500)
  }
}

await browser.close()
