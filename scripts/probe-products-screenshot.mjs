// Diagnostic (not part of npm test): runs only the admin-screens "products
// renders and fits the screen" step, 5x at 390 and 1440 in WebKit, and logs
// how long page.screenshot takes plus what is still loading when it starts.
// Run inside scripts/test-env.sh (emulator only).
import { webkit } from 'playwright'
import { BASE_URL, db, resetEmulators, createAdmin } from './lib/emu.mjs'
import { apiAs, createProduct, switchOn, loginAdmin, sleep } from './lib/phase2.mjs'

await resetEmulators()
const sim = await createAdmin('sim@sbh.test', 'owner')
const api = apiAs(sim.email)
// Same catalogue shape as admin-screens.test.mjs.
for (const [id, d] of Object.entries({
  tin: { name: 'Cake tin 8in', price: 18, category: 'Tools', inStock: true },
  whisk: { name: 'Balloon whisk', price: 12.9, category: 'Tools', inStock: true },
  cocoa: { name: 'Cocoa powder 500g', price: 9.9, category: 'Baking', inStock: true },
  sprinkles: { name: 'Rainbow sprinkles', category: 'Baking', inStock: true },
})) await db().collection('products').doc(id).set(d)
for (const name of ['Rice flour', 'Butter 250g', 'Fondant (custom colour)']) {
  const id = await createProduct(api, {
    name, category: 'Flour', baseUnit: 'kg', lowStockThresholdMilli: 1000, trackExpiry: false, barcodes: [],
    sellUnits: [{ id: 'kg1', label: '1 kg', factorMilli: 1000, priceSen: 650, channel: 'both' }],
  })
  await switchOn(api, id, 5000)
}

const browser = await webkit.launch()
const results = []
for (const width of [390, 1440]) {
  const ctx = await browser.newContext(width < 800 ? { viewport: { width, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width, height: 900 } })
  const page = await ctx.newPage()
  const inflight = new Map()
  page.on('request', (r) => inflight.set(r, Date.now()))
  page.on('requestfinished', (r) => inflight.delete(r))
  page.on('requestfailed', (r) => inflight.delete(r))
  await loginAdmin(page, sim.email)
  for (let run = 1; run <= 5; run++) {
    await page.goto(`${BASE_URL}/admin/products`)
    await page.getByRole('heading', { name: 'Products', exact: true }).first().waitFor({ timeout: 15000 })
    await sleep(400)
    const state = await page.evaluate(() => ({
      fonts: document.fonts.status,
      fontFaces: [...document.fonts].map((f) => `${f.family}:${f.status}`).filter((s) => !s.endsWith(':loaded')),
      images: [...document.images].map((i) => ({ src: i.currentSrc.replace(location.origin, ''), complete: i.complete, w: i.naturalWidth, loading: i.loading, inView: i.getBoundingClientRect().top < innerHeight })),
      docHeight: document.documentElement.scrollHeight,
    }))
    const pending = [...inflight.entries()].map(([r, t]) => `${r.method()} ${r.url().replace(BASE_URL, '').slice(0, 90)} (${Date.now() - t} ms)`)
    const t0 = Date.now()
    let outcome = 'ok'
    try {
      await page.screenshot({ path: `.screenshots/phase2/probe-products-${width}-${run}.png`, fullPage: true, timeout: 60000 })
    } catch (e) {
      outcome = `FAILED: ${String(e.message).split('\n')[0]}`
    }
    const ms = Date.now() - t0
    const incomplete = state.images.filter((i) => !i.complete)
    results.push({ width, run, ms, outcome })
    console.log(`\n[${width}px run ${run}] screenshot ${ms} ms ${outcome}`)
    console.log(`  fonts=${state.fonts} notLoaded=${JSON.stringify(state.fontFaces)} docHeight=${state.docHeight}`)
    console.log(`  images: ${state.images.length} total, ${incomplete.length} incomplete ${JSON.stringify(incomplete.slice(0, 5))}`)
    console.log(`  in-flight requests (${pending.length}): ${JSON.stringify(pending.slice(0, 8))}`)
  }
  await ctx.close()
}
console.log('\nSUMMARY')
console.table(results)
await browser.close()
process.exit(0)
