// Storefront UX in a real browser (WebKit) at 375 px and 1440 px, in English
// and 中文: hero, How to order, Ask Sim, collections (empty one hidden),
// chilled notice (product, cart, checkout), language line (setting), live
// search (EN / ZH / code, Chinese IME composition), Ask Sim fallback, and
// the phone-only sticky cart bar. Needs scripts/seed-shop.mjs before the
// build (npm run test:storefront does both). Emulator only.
import { mkdirSync } from 'fs'
import { webkit } from 'playwright'
import { BASE_URL, check, assert, summary } from './lib/emu.mjs'
import { sleep } from './lib/phase2.mjs'

const SHOTS = process.env.SHOTS_DIR || '.screenshots/storefront'
mkdirSync(SHOTS, { recursive: true })
const WA = '60123456789'

const browser = await webkit.launch()
const pageErrors = []

async function newPage(width) {
  const ctx = await browser.newContext(
    width < 800 ? { viewport: { width, height: 812 }, isMobile: true, hasTouch: true } : { viewport: { width, height: 900 } },
  )
  await ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (r) => r.abort())
  const page = await ctx.newPage()
  page.on('pageerror', (e) => {
    if (!/access control checks|Load failed/.test(e.message)) pageErrors.push(`${width}px ${page.url()}: ${e.message}`)
  })
  return page
}

async function setLang(page, width, lang) {
  const label = lang === 'zh' ? '中文' : 'EN'
  if (width < 1024) {
    await page.getByRole('button', { name: /Open menu|Close menu/ }).click()
    await page.locator('#mobile-nav-panel').getByRole('button', { name: label, exact: true }).click()
    await page.getByRole('button', { name: 'Close menu' }).click()
  } else {
    await page.locator('header').getByRole('button', { name: label, exact: true }).click()
  }
  await sleep(200)
}

async function noSidewaysScroll(page) {
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: document.documentElement.clientWidth }))
  assert(r.sw <= r.w + 1, `sideways scroll: ${r.sw} > ${r.w}`)
}

const T = {
  en: {
    title: 'Your baking supply shop',
    sub: 'Your friendly neighbourhood baking supply shop in Bayan Lepas.',
    browse: 'Browse baking ingredients',
    start: 'New to baking? Start here',
    howto: 'How to order',
    noDeliver: 'We don’t deliver.',
    ask: 'Ask Sim on WhatsApp',
    first: 'Baking for the first time?',
    bundles: 'Baking bundles',
    regulars: 'For regulars and home businesses',
    langLine: 'We speak English, Bahasa Melayu and 中文',
    rice: 'Rice flour',
    chilled: 'TEST chilled notice: keep it cold.',
    checkout: 'Checkout',
  },
  zh: {
    title: '你的烘焙材料店',
    sub: '峇六拜的邻里烘焙材料店。',
    browse: '看看烘焙材料',
    start: '第一次烘焙？从这里开始',
    howto: '怎么下单',
    noDeliver: '我们不提供送货。',
    ask: '在 WhatsApp 问 Sim',
    first: '第一次烘焙？',
    bundles: '烘焙组合',
    regulars: '常客与家庭烘焙生意',
    langLine: '我们会说英语、马来语和中文',
    rice: '米粉',
    chilled: '测试冷藏提示：请保持冰冷。',
    checkout: '去下单',
  },
}

for (const width of [375, 1440]) {
  for (const lang of ['en', 'zh']) {
    const t = T[lang]
    const tag = `${width}px ${lang}`
    const page = await newPage(width)
    await page.goto(`${BASE_URL}/`)
    await page.getByTestId('hero').waitFor({ timeout: 20000 })
    if (lang === 'zh') await setLang(page, width, 'zh')

    await check(`${tag} hero: supply-shop headline, sub-headline, both buttons, photo placeholder`, async () => {
      const hero = page.getByTestId('hero')
      await hero.getByRole('heading', { level: 1, name: t.title }).waitFor()
      assert((await hero.innerText()).includes(t.sub), 'sub-headline missing')
      assert((await page.getByTestId('hero-browse').getAttribute('href')) === '/products', 'browse href')
      assert((await page.getByTestId('hero-start').getAttribute('href')) === '/products?collection=first-time', 'start href')
      const btns = (await page.getByTestId('hero-browse').innerText()) + '|' + (await page.getByTestId('hero-start').innerText())
      assert(btns.toLowerCase().includes(t.browse.toLowerCase()) && btns.toLowerCase().includes(t.start.toLowerCase()), btns)
      await page.getByTestId('hero-placeholder').waitFor()
      if (width < 800) {
        // Both buttons are visible without scrolling on a phone.
        const box = await page.getByTestId('hero-start').boundingBox()
        assert(box && box.y + box.height <= 812, `start button below the fold: ${box?.y}`)
      }
    })

    await check(`${tag} How to order: 3 steps, hours from settings, no delivery`, async () => {
      const how = page.getByTestId('how-to-order')
      await how.getByRole('heading', { name: t.howto }).waitFor()
      assert((await how.locator('ol > li').count()) === 3, 'not 3 steps')
      const text = await how.innerText()
      assert(text.includes('6:30 AM - 1:00 PM'), 'hours missing')
      assert(text.includes(t.noDeliver), 'no-delivery line missing')
      assert(/DuitNow/.test(text) && /Grab/.test(text) && /Lalamove/.test(text), text)
    })

    await check(`${tag} Ask Sim: WhatsApp link to the shop number with a message; language line (setting on)`, async () => {
      const ask = page.getByTestId('ask-sim-button')
      assert((await ask.innerText()).includes(t.ask), await ask.innerText())
      const href = await ask.getAttribute('href')
      assert(href.startsWith(`https://wa.me/${WA}?text=`), href)
      assert((await page.getByTestId('ask-sim').getByTestId('language-line').innerText()).includes(t.langLine), 'language line')
    })

    await check(`${tag} collections: filled ones shown, empty "regulars" hidden`, async () => {
      const cols = page.getByTestId('collections')
      await cols.getByRole('heading', { name: t.first }).waitFor()
      await cols.getByRole('heading', { name: t.bundles }).waitFor()
      assert((await page.getByTestId('collection-regulars').count()) === 0, 'empty collection shown')
      assert(!(await cols.innerText()).includes(t.regulars), 'regulars title shown')
      assert((await page.getByTestId('collection-first-time').innerText()).includes(t.rice), 'product name not in the chosen language')
      await noSidewaysScroll(page)
      await page.screenshot({ path: `${SHOTS}/home-${width}-${lang}.png`, fullPage: true })
    })

    await check(`${tag} "Start here" opens the first-timers collection`, async () => {
      await page.getByTestId('hero-start').click()
      await page.waitForURL(/collection=first-time/)
      await page.getByTestId('collection-filter').waitFor()
      const grid = page.locator('main')
      await grid.getByRole('heading', { name: t.rice, exact: true }).first().waitFor()
      const names = await page.locator('main h3').allInnerTexts()
      assert(!names.some((n) => /Butter|牛油/.test(n)), `butter is not first-time: ${names.join(', ')}`)
    })

    await check(`${tag} live search: English, Chinese and code`, async () => {
      await page.goto(`${BASE_URL}/products`)
      await page.getByTestId('product-search').waitFor()
      if (lang === 'zh') await sleep(300)
      const search = page.getByTestId('product-search')
      const names = async () => page.locator('main h3').allInnerTexts()
      await search.fill('rice')
      await sleep(150)
      assert((await names()).join('|').includes(t.rice) && !(await names()).some((n) => /Cocoa|可可/.test(n)), (await names()).join('|'))
      await search.fill('可可')
      await sleep(150)
      assert((await names()).some((n) => /Cocoa|可可/.test(n)) && (await names()).length === 1, (await names()).join('|'))
      await search.fill('f00011')
      await sleep(150)
      assert((await names()).length === 1 && (await names())[0] === t.rice, (await names()).join('|'))
      await search.fill('')
    })

    await check(`${tag} live search: Chinese IME does not filter on half-typed pinyin`, async () => {
      const search = page.getByTestId('product-search')
      const all = await page.locator('main h3').count()
      await search.evaluate((el) => {
        const set = (v) => {
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v)
          el.dispatchEvent(new Event('input', { bubbles: true }))
        }
        el.focus()
        el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }))
        set('mi')
        el.dispatchEvent(new CompositionEvent('compositionupdate', { bubbles: true, data: 'mi' }))
      })
      await sleep(200)
      assert((await page.getByTestId('search-none').count()) === 0, 'filtered on pinyin while composing')
      assert((await page.locator('main h3').count()) === all, 'list changed while composing')
      await search.evaluate((el) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '米粉')
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '米粉' }))
      })
      await sleep(200)
      const names = await page.locator('main h3').allInnerTexts()
      assert(names.length === 1 && names[0] === t.rice, names.join('|'))
      await search.fill('')
    })

    await check(`${tag} no results: Ask Sim fallback with the search in the message`, async () => {
      await page.getByTestId('product-search').fill('unicorn sprinkles')
      await page.getByTestId('search-none').waitFor()
      const href = await page.getByTestId('search-ask-sim').getAttribute('href')
      assert(href.startsWith(`https://wa.me/${WA}?text=`) && decodeURIComponent(href).includes('unicorn sprinkles'), href)
      await page.screenshot({ path: `${SHOTS}/search-none-${width}-${lang}.png` })
      await page.getByTestId('product-search').fill('')
    })

    await check(`${tag} chilled: tag on the card, notice in the product, cart and checkout (text from settings)`, async () => {
      const butterName = lang === 'zh' ? '牛油 250克' : 'Butter 250g'
      const card = page.locator('div.group', { has: page.getByRole('heading', { name: butterName, exact: true }) }).first()
      await card.getByTestId('chilled-tag').waitFor()
      await card.click()
      const notice = page.getByTestId('chilled-notice').first()
      await notice.waitFor()
      assert((await notice.innerText()).includes(t.chilled), await notice.innerText())
      await page.getByRole('button', { name: lang === 'zh' ? '加入购物车' : 'Add to cart' }).click()
      await sleep(300)
      // The cart drawer opens on add in this shop; if not, open it.
      const drawerNotice = page.locator('.fixed.inset-0.z-\\[100\\]').getByTestId('chilled-notice')
      if (!(await drawerNotice.isVisible().catch(() => false))) {
        await page.keyboard.press('Escape').catch(() => {})
        await page.locator('header').getByRole('button', { name: /cart|购物车/i }).first().click()
      }
      await drawerNotice.waitFor()
      assert((await drawerNotice.innerText()).includes(t.chilled), 'cart notice text')
      await page.screenshot({ path: `${SHOTS}/cart-chilled-${width}-${lang}.png` })
      await page.locator('.fixed.inset-0.z-\\[100\\]').getByRole('button', { name: lang === 'zh' ? '去下单' : 'Continue to order' }).click()
      await page.waitForURL(/\/checkout/)
      await page.locator('main').getByTestId('chilled-notice').waitFor()
    })

    if (width < 800) {
      await check(`${tag} sticky cart bar: count + total + checkout; never covers content; Categories button above it`, async () => {
        await page.goto(`${BASE_URL}/products`)
        const bar = page.getByTestId('mobile-cart-bar')
        await bar.waitFor()
        const text = await bar.innerText()
        assert(/RM\s*12\.90/.test(text) && (text.includes('1 item') || text.includes('1 件')), text)
        assert((await page.getByTestId('mobile-cart-checkout').innerText()).toLowerCase().includes(t.checkout.toLowerCase()), 'checkout label')
        // Scrolled to the very bottom, the last footer line sits above the bar.
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
        await sleep(300)
        const barTop = (await bar.boundingBox()).y
        const lastLine = await page.locator('footer a').last().boundingBox()
        assert(lastLine.y + lastLine.height <= barTop + 1, `footer covered: ${lastLine.y + lastLine.height} > ${barTop}`)
        const cat = await page.getByRole('button', { name: 'Categories' }).last().boundingBox()
        assert(cat.y + cat.height <= barTop, `Categories button covered: ${cat.y + cat.height} > ${barTop}`)
        await noSidewaysScroll(page)
        await page.screenshot({ path: `${SHOTS}/sticky-bar-${width}-${lang}.png` })
        await page.getByTestId('mobile-cart-checkout').click()
        await page.waitForURL(/\/checkout/)
        assert((await page.getByTestId('mobile-cart-bar').count()) === 0, 'bar shown on checkout')
      })
    } else {
      await check(`${tag} no sticky cart bar on desktop`, async () => {
        await page.goto(`${BASE_URL}/products`)
        await page.getByTestId('product-search').waitFor()
        assert(!(await page.getByTestId('mobile-cart-bar').isVisible().catch(() => false)), 'bar visible on desktop')
      })
    }
    await page.context().close()
  }
}

await check('no uncaught page errors', async () => {
  assert(pageErrors.length === 0, pageErrors.join(' | '))
})

await browser.close()
process.exit(summary() ? 1 : 0)
