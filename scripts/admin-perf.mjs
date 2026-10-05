// Measures a cold load of /admin as a signed-in admin, against the
// emulator. Run inside scripts/test-env.sh with NEXT_PUBLIC_FS_METRICS=1:
//
//   NEXT_PUBLIC_FS_METRICS=1 bash scripts/test-env.sh node scripts/admin-perf.mjs
//
// "Cold" = a fresh browser context (empty HTTP cache), already signed in
// (auth state restored from IndexedDB, like Sim reopening the app).
import { chromium } from 'playwright'
import { BASE_URL, db, resetEmulators, createAdmin } from './lib/emu.mjs'

const ORDER_MIX = { new: 25, confirmed: 15, paid: 10, ready: 10, collected: 180, cancelled: 60 }
const PRODUCT_COUNT = 250
const RUNS = 3

await resetEmulators()
const admin = await createAdmin('owner@test.local')
{
  const firestore = db()
  let batch = firestore.batch()
  let n = 0
  let i = 0
  for (const [status, count] of Object.entries(ORDER_MIX)) {
    for (let k = 0; k < count; k++, i++) {
      const created = new Date(Date.now() - i * 3600_000).toISOString()
      const id = `SBH-${String(1000 + i)}`
      batch.set(firestore.collection('orders').doc(id), {
        orderId: id, status, userId: null, customerName: `Customer ${i}`, customerPhone: '60123456789',
        phoneLast4: '6789', fulfilment: 'pickup', collectDate: '2026-10-10', collectTime: '08:00', notes: '',
        items: [{ productId: 'p1', name: 'Flour 1kg', qty: 2, unitPriceSnapshot: 5.5 }],
        estimatedTotal: 11, confirmedTotal: null, createdAt: created, updatedAt: created,
        statusHistory: [{ status: 'new', at: created }],
      })
      if (++n % 400 === 0) { await batch.commit(); batch = firestore.batch() }
    }
  }
  for (let p = 0; p < PRODUCT_COUNT; p++) {
    batch.set(firestore.collection('products').doc(`prod-${p}`), {
      name: `Product ${String(p).padStart(3, '0')}`, price: 5 + (p % 20), category: 'flour', inStock: true,
      imageUrl: '/images/placeholder-product.jpg', description: '',
    })
    if (++n % 400 === 0) { await batch.commit(); batch = firestore.batch() }
  }
  await batch.commit()
}

const browser = await chromium.launch()
const mobile = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }

// Sign in once, keep the auth state (Firebase Auth persists to IndexedDB).
const loginCtx = await browser.newContext(mobile)
const loginPage = await loginCtx.newPage()
await loginPage.goto(`${BASE_URL}/admin/login`)
await loginPage.fill('#email', admin.email)
await loginPage.fill('#password', admin.password)
await loginPage.click('button[type=submit]')
await loginPage.waitForSelector('a[href^="/admin/orders/"]', { timeout: 30000 })
const storageState = await loginCtx.storageState({ indexedDB: true })
await loginCtx.close()

const results = []
for (let run = 0; run < RUNS; run++) {
  const ctx = await browser.newContext({ ...mobile, storageState })
  const page = await ctx.newPage()
  // Phone-like conditions: Chrome DevTools' "Slow 4G" preset + 4x CPU slowdown.
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
  })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const requests = []
  page.on('requestfinished', async (req) => {
    const timing = req.timing()
    let bytes = 0
    try { bytes = (await req.sizes()).responseBodySize } catch {}
    requests.push({ url: req.url(), type: req.resourceType(), start: timing.startTime, end: timing.startTime + timing.responseEnd, bytes })
  })
  const t0 = Date.now()
  await page.goto(`${BASE_URL}/admin`)
  await page.waitForSelector('a[href^="/admin/orders/"]', { timeout: 30000 })
  const firstRowMs = Date.now() - t0
  // Live data = rows on screen AND not the cached "Updating…" placeholder.
  await page.waitForFunction(() => document.querySelector('a[href^="/admin/orders/"]') && !/Updating…/.test(document.body.innerText), null, { timeout: 30000 })
  const liveRowMs = Date.now() - t0
  await page.waitForTimeout(2500)
  const reads = await page.evaluate(() => window.__fsReads ?? 0)
  const nav = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0]
    return { domInteractive: Math.round(n.domInteractive), loadEvent: Math.round(n.loadEventEnd) }
  })
  let readsAfterAll = null
  if (run === RUNS - 1) {
    const allTab = page.getByRole('tab', { name: 'All', exact: true })
    await ((await allTab.count()) ? allTab : page.getByRole('button', { name: 'All', exact: true })).click()
    await page.waitForTimeout(6000)
    readsAfterAll = await page.evaluate(() => window.__fsReads ?? 0)
  }
  // Warm: same browser profile, a moment later — JS in HTTP cache, auth in
  // IndexedDB, last-seen orders in localStorage. What reopening the app is like.
  const warmPage = await ctx.newPage()
  const warmCdp = await ctx.newCDPSession(warmPage)
  await warmCdp.send('Network.enable')
  await warmCdp.send('Network.emulateNetworkConditions', {
    offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
  })
  await warmCdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const tw = Date.now()
  await warmPage.goto(`${BASE_URL}/admin`)
  await warmPage.waitForSelector('a[href^="/admin/orders/"]', { timeout: 30000 })
  const warmFirstRowMs = Date.now() - tw
  await warmPage.close()
  const sameOrigin = requests.filter((r) => r.url.startsWith(BASE_URL))
  const jsBytes = sameOrigin.filter((r) => r.type === 'script').reduce((s, r) => s + r.bytes, 0)
  const jsCount = sameOrigin.filter((r) => r.type === 'script').length
  results.push({ firstRowMs, liveRowMs, warmFirstRowMs, reads, readsAfterAll, jsBytes, jsCount, nav, requests, t0 })
  await ctx.close()
}
await browser.close()

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
console.log(`Dataset: ${Object.values(ORDER_MIX).reduce((a, b) => a + b)} orders, ${PRODUCT_COUNT} products`)
console.log(`Cold load of /admin (signed in), ${RUNS} runs, mobile viewport:`)
console.log(`  time to first order row: ${results.map((r) => r.firstRowMs).join(' / ')} ms  (median ${median(results.map((r) => r.firstRowMs))} ms)`)
console.log(`  ...live data on screen:  ${results.map((r) => r.liveRowMs).join(' / ')} ms  (median ${median(results.map((r) => r.liveRowMs))} ms)`)
console.log(`  warm reload, first row:  ${results.map((r) => r.warmFirstRowMs).join(' / ')} ms  (median ${median(results.map((r) => r.warmFirstRowMs))} ms)`)
console.log(`  domInteractive:          median ${median(results.map((r) => r.nav.domInteractive))} ms`)
console.log(`  JS transferred:          ${(median(results.map((r) => r.jsBytes)) / 1024).toFixed(1)} KB over ${results[0].jsCount} files (compressed)`)
console.log(`  Firestore reads:         ${results.map((r) => r.reads).join(' / ')} on landing`)
console.log(`  ...after opening "All":  ${results[results.length - 1].readsAfterAll} cumulative`)

const last = results[results.length - 1]
const base = Math.min(...last.requests.map((r) => r.start))
console.log('\nRequest waterfall (last run, ms from first request):')
for (const r of last.requests.sort((a, b) => a.start - b.start)) {
  const short = r.url.replace(BASE_URL, '').replace(/^https?:\/\//, '').slice(0, 70)
  console.log(`  ${String(Math.round(r.start - base)).padStart(5)} → ${String(Math.round(r.end - base)).padStart(5)}  ${r.type.padEnd(10)} ${short}`)
}
