// Lighthouse (mobile preset, simulated throttling) for the admin pages,
// signed in, against the local production build + emulator. Run inside
// scripts/test-env.sh:  bash scripts/test-env.sh node scripts/admin-lighthouse.mjs
// Uses Playwright's Chromium with a saved profile so Lighthouse runs as a
// signed-in admin (--disable-storage-reset keeps the Firebase session).
// Lighthouse is not a project dependency: point LIGHTHOUSE_BIN at an
// installed binary (e.g. `npm i --prefix /tmp/lh lighthouse@12`, then
// LIGHTHOUSE_BIN=/tmp/lh/node_modules/.bin/lighthouse), else npx fetches 12.x.
import { execFileSync } from 'child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { chromium } from 'playwright'
import { BASE_URL, db, resetEmulators, createAdmin } from './lib/emu.mjs'
import { apiAs, createProduct, switchOn, placeOrders, loginAdmin } from './lib/phase2.mjs'

const OUT = process.env.SHOTS_DIR || '.screenshots/phase2'
const PROFILE = `${OUT}/lh-profile`
mkdirSync(OUT, { recursive: true })

await resetEmulators()
const sim = await createAdmin('sim@sbh.test', 'owner')
const api = apiAs(sim.email)
for (let i = 0; i < 40; i++) {
  await db().collection('products').doc(`p${i}`).set({ name: `Product ${i}`, price: 5 + i, category: ['Flour', 'Tools', 'Dairy'][i % 3], inStock: true })
}
const rice = await createProduct(api, {
  name: 'Rice flour', category: 'Flour', baseUnit: 'kg', lowStockThresholdMilli: 3000, trackExpiry: false, barcodes: [],
  sellUnits: [{ id: 'kg1', label: '1 kg', factorMilli: 1000, priceSen: 650, channel: 'both' }],
})
await switchOn(api, rice, 12000)
await placeOrders([[{ productId: rice, sellUnitId: 'kg1', qty: 2 }]])

// Sign in once into a persistent profile.
const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true })
const page = await ctx.newPage()
await loginAdmin(page, sim.email)
await page.goto(`${BASE_URL}/admin/stock`)
await page.waitForTimeout(1500)
const chromePath = chromium.executablePath()
await ctx.close()

const PAGES = [
  ['/admin/login', 'login'],
  ['/admin', 'orders'],
  ['/admin/stock', 'stock'],
  [`/admin/stock/${rice}`, 'stock-product'],
  ['/admin/products', 'products'],
  ['/admin/products/new', 'product-new'],
  ['/admin/sale', 'sale'],
]
const rows = []
for (const [path, name] of PAGES) {
  const out = `${OUT}/lh-${name}.json`
  const bin = process.env.LIGHTHOUSE_BIN
  execFileSync(bin || 'npx', [
    ...(bin ? [] : ['-y', 'lighthouse@12']), `${BASE_URL}${path}`,
    '--output=json', `--output-path=${out}`, '--quiet',
    '--only-categories=performance,accessibility,best-practices',
    '--disable-storage-reset',
    `--chrome-flags=--headless=new --user-data-dir=${PROFILE}`,
  ], { stdio: 'inherit', env: { ...process.env, CHROME_PATH: chromePath } })
  const r = JSON.parse(readFileSync(out, 'utf8'))
  const a = r.audits
  const js = (a['resource-summary']?.details?.items ?? []).find((i) => i.resourceType === 'script')
  rows.push({
    page: path.replace(rice, '[id]'),
    finalUrl: r.finalDisplayedUrl.replace(BASE_URL, ''),
    perf: Math.round(r.categories.performance.score * 100),
    a11y: Math.round(r.categories.accessibility.score * 100),
    bp: Math.round(r.categories['best-practices'].score * 100),
    lcp: a['largest-contentful-paint'].displayValue,
    tbt: a['total-blocking-time'].displayValue,
    cls: a['cumulative-layout-shift'].displayValue,
    jsKB: js ? Math.round(js.transferSize / 1024) : null,
    a11yFails: Object.values(a).filter((x) => x.score === 0 && r.categories.accessibility.auditRefs.some((ref) => ref.id === x.id)).map((x) => x.id),
  })
}
console.table(rows.map(({ a11yFails, ...r }) => r))
for (const r of rows) if (r.a11yFails.length) console.log(`${r.page} accessibility issues: ${r.a11yFails.join(', ')}`)
writeFileSync(`${OUT}/lighthouse-summary.json`, JSON.stringify(rows, null, 2))
process.exit(0)
