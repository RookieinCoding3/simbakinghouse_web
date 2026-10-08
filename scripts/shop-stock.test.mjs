// Customer side of Phase 2 in a real browser (WebKit, 390 and 1440): stock
// status on cards and in the modal, sizes, out of stock disabled, "Ask for
// price", cart and checkout with sizes. Needs scripts/seed-shop.mjs to have
// run before the build (npm run test:shop does both). Emulator only.
import { mkdirSync } from 'fs'
import { webkit } from 'playwright'
import { BASE_URL, db, check, assert, summary } from './lib/emu.mjs'
import { waitForDoc, sleep } from './lib/phase2.mjs'

const SHOTS = process.env.SHOTS_DIR || '.screenshots/phase2'
mkdirSync(SHOTS, { recursive: true })

const browser = await webkit.launch()
const pageErrors = []

async function openShop(width) {
  const ctx = await browser.newContext(
    width < 800 ? { viewport: { width, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width, height: 900 } }
  )
  // Checkout opens WhatsApp in a new tab: never let a test leave localhost.
  await ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (r) => r.abort())
  const page = await ctx.newPage()
  page.on('pageerror', (e) => {
    if (!/access control checks|Load failed/.test(e.message)) pageErrors.push(`${width}px ${page.url()}: ${e.message}`)
  })
  await page.goto(`${BASE_URL}/products`)
  await page.getByRole('heading', { name: 'Rice flour' }).first().waitFor({ timeout: 20000 })
  return page
}
const card = (page, name) => page.locator('div.group', { has: page.getByRole('heading', { name, exact: true }) }).first()
const dialog = (page) => page.locator('[role=radiogroup][aria-label=Size], button:has-text("Add to cart"), button:has-text("Out of stock")').first()

for (const width of [390, 1440]) {
  const page = await openShop(width)

  await check(`${width}px cards: In stock / Low stock labels on managed products; no label on old products`, async () => {
    // innerText follows CSS text-transform (uppercase labels), so match case-insensitively.
    assert(/in stock/i.test(await card(page, 'Rice flour').innerText()), await card(page, 'Rice flour').innerText())
    assert(/low stock/i.test(await card(page, 'Butter 250g').innerText()), 'butter not low')
    for (const old of ['Cocoa powder', 'Cake topper custom']) {
      const t = await card(page, old).innerText()
      assert(!/in stock|low stock|out of stock/i.test(t), `${old} shows a status: ${t}`)
    }
  })

  await check(`${width}px cards: managed "out" and old inStock=false both show the Out of stock overlay`, async () => {
    assert(/out of stock/i.test(await card(page, 'Fondant custom colour').innerText()), 'fondant')
    assert(/out of stock/i.test(await card(page, 'Old cake tin').innerText()), 'old tin')
  })

  await check(`${width}px cards: prices — "from RM 3.50" for sizes, "Ask for price" kept, legacy price unchanged`, async () => {
    assert((await card(page, 'Rice flour').innerText()).includes('from RM 3.50'), await card(page, 'Rice flour').innerText())
    assert((await card(page, 'Cake topper custom').innerText()).includes('Ask for price'), 'topper')
    assert((await card(page, 'Fondant custom colour').innerText()).includes('Ask for price'), 'fondant price')
    assert((await card(page, 'Cocoa powder').innerText()).includes('RM 9.90'), 'cocoa')
  })

  await check(`${width}px the shop never shows stock numbers`, async () => {
    const html = await page.content()
    for (const leak of ['onHandMilli', 'reservedMilli', '12 kg', '2 pc left', '13000', '25 kg bag']) assert(!html.includes(leak), `page contains "${leak}"`)
  })

  await check(`${width}px no sideways scroll on /products`, async () => {
    const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: document.documentElement.clientWidth }))
    assert(r.sw <= r.w + 1, `${r.sw} > ${r.w}`)
    await page.screenshot({ path: `${SHOTS}/shop-products-${width}.png`, fullPage: false })
  })

  await check(`${width}px modal (managed, sizes): online sizes only, wholesale note, status, price follows the size`, async () => {
    await card(page, 'Rice flour').click()
    await dialog(page).waitFor()
    const sizes = await page.getByRole('radiogroup', { name: 'Size' }).getByRole('radio').allInnerTexts()
    assert(sizes.join('|') === '1 kg · RM 6.50|500 g pack · RM 3.50', `sizes: ${sizes}`)
    await page.getByText('Bigger wholesale sizes are available').waitFor()
    assert((await page.getByTestId('stock-status').innerText()).toLowerCase() === 'in stock', 'status')
    await page.getByRole('radio', { name: /500 g pack/ }).click()
    await page.getByText('RM 3.50', { exact: true }).first().waitFor()
    assert((await page.getByRole('radio', { name: /500 g pack/ }).getAttribute('aria-checked')) === 'true', 'tapped size not selected')
    await sleep(400) // let the colour transition finish before the screenshot
    await page.screenshot({ path: `${SHOTS}/shop-modal-${width}.png` })
    await page.getByRole('button', { name: 'Add to cart' }).click()
    await sleep(300)
    await page.keyboard.press('Escape')
  })

  await check(`${width}px modal (managed, out): Add is disabled and says Out of stock`, async () => {
    await page.goto(`${BASE_URL}/products`)
    await card(page, 'Fondant custom colour').click()
    const b = page.getByRole('button', { name: 'Out of stock' })
    await b.waitFor()
    assert(await b.isDisabled(), 'out-of-stock add enabled')
  })

  if (width === 390) {
    await check('390px cart and checkout: sizes shown; order saved with the size and "price to confirm" for the Ask-for-price item', async () => {
      await page.goto(`${BASE_URL}/products`)
      await card(page, 'Cake topper custom').click()
      await page.getByRole('button', { name: 'Add to cart' }).click()
      await sleep(300)
      await page.goto(`${BASE_URL}/checkout`)
      await page.getByRole('heading', { name: 'Checkout' }).waitFor()
      const summaryText = await page.locator('main').innerText()
      assert(/Rice flour/.test(summaryText) && /500 g pack/.test(summaryText), `no size in checkout: ${summaryText.slice(0, 400)}`)
      assert(/Ask for price/.test(summaryText), 'no Ask for price line')
      await page.screenshot({ path: `${SHOTS}/shop-checkout-390.png`, fullPage: true })
      await page.locator('#name').fill('Shop Test')
      await page.locator('#phone').fill('012-345 6789')
      await page.locator('#collectDate').fill(new Date(Date.now() + 2 * 86400_000).toISOString().slice(0, 10))
      await page.locator('#collectTime').fill('10:00')
      await page.locator('form input[type=checkbox][required]').check()
      await sleep(3200) // the server refuses forms sent in under 3 s
      await page.getByRole('button', { name: 'Send order on WhatsApp' }).click()
      await page.waitForURL(/\/order\/SBH-/, { timeout: 20000 })
      const orderId = page.url().split('/order/')[1]
      const o = await waitForDoc('orders', orderId, () => true)
      const rice = o.items.find((i) => i.productId === 'shop-rice')
      assert(rice?.sellUnitId === 'g500' && rice.unitPriceSen === 350 && rice.baseQtyMilli === 500, JSON.stringify(rice))
      assert(o.priceToConfirm === true && o.estimatedTotalSen === 350, `priceToConfirm ${o.priceToConfirm} total ${o.estimatedTotalSen}`)
    })
  }
  await page.context().close()
}

await check('no uncaught page errors', async () => {
  assert(pageErrors.length === 0, pageErrors.join(' | '))
})

await browser.close()
process.exit(summary() ? 1 : 0)
