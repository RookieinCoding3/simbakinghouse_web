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

    if (width < 800) {
      await check(`${tag} phone header has a language switch and fits without sideways scroll`, async () => {
        const b = page.getByTestId('lang-compact')
        await b.waitFor()
        assert((await b.innerText()).trim() === (lang === 'zh' ? 'EN' : '中文'), await b.innerText())
        const box = await page.locator('header').boundingBox()
        const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: document.documentElement.clientWidth }))
        assert(r.sw <= r.w + 1 && box.width <= 376, `header overflow ${r.sw}/${r.w}`)
      })
    }

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
      const prices = await page.getByTestId('collection-price').allInnerTexts()
      assert(prices.length > 0 && prices.every((x) => /RM\s?\d|Ask for price|价格请询问/.test(x)), `card prices: ${prices.join('|')}`)
      await noSidewaysScroll(page)
      await page.screenshot({ path: `${SHOTS}/home-${width}-${lang}.png`, fullPage: true })
    })

    await check(`${tag} a collection card opens that product (price shown)`, async () => {
      const cardLink = page.getByTestId('collection-first-time').getByTestId('collection-product').filter({ hasText: t.rice }).first()
      assert(/RM\s?3\.50|from|起价/.test(await cardLink.innerText()), await cardLink.innerText())
      await cardLink.click()
      await page.waitForURL(/product=shop-rice/)
      await page.getByTestId('returns-note').waitFor()
      if (width < 800) {
        const btn = await page.getByTestId('modal-buy').getByRole('button').last().boundingBox()
        assert(btn && btn.y + btn.height <= 812, `Add to cart below the fold: ${btn?.y}`)
      }
      await page.getByTestId('product-ask-sim').waitFor()
      const href = await page.getByTestId('product-ask-sim').getAttribute('href')
      assert(href.startsWith(`https://wa.me/${WA}?text=`), href)
      const note = await page.getByTestId('returns-note').innerText()
      assert(/24/.test(note) && !/non-refundable/i.test(note), note)
      await page.goto(`${BASE_URL}/`)
      await page.getByTestId('hero').waitFor()
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
      await search.fill(lang === 'zh' ? 'flor' : 'ryce flor')
      await sleep(150)
      assert((await names()).some((n) => n === t.rice), `typo search: ${(await names()).join('|')}`)
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
      assert(/WhatsApp/.test(await page.getByTestId('cart-how').innerText()), 'cart how-it-works line')
      await page.screenshot({ path: `${SHOTS}/cart-chilled-${width}-${lang}.png` })
      await page.locator('.fixed.inset-0.z-\\[100\\]').getByRole('button', { name: lang === 'zh' ? '去下单' : 'Continue to order' }).click()
      await page.waitForURL(/\/checkout/)
      await page.locator('main').getByTestId('chilled-notice').waitFor()
      // The earliest day (tomorrow) is already chosen, with a hint.
      assert((await page.locator('#collectDate').inputValue()) !== '', 'collection date not preselected')
      if (width === 375 || lang === 'zh') {
        await page.locator('#name').fill('Store Test')
        await page.locator('#phone').fill('012-345 6789')
        await page.locator('#collectTime').fill('10:00')
        await page.locator('form input[type=checkbox][required]').check()
        await sleep(3200) // the server refuses forms sent in under 3 s
        await page.getByRole('button', { name: lang === 'zh' ? '用 WhatsApp 发送订单' : 'Send order on WhatsApp' }).click()
        await page.waitForURL(/\/order\/SBH-/, { timeout: 20000 })
        const steps = page.getByTestId('order-next-steps')
        await steps.waitFor()
        const send = await page.getByTestId('order-send-whatsapp').getAttribute('href')
        const text = decodeURIComponent(send)
        assert(send.startsWith(`https://wa.me/${WA}?text=`) && text.includes(page.url().split('/order/')[1]), send)
        assert(text.includes(`${BASE_URL}/order/`), `link uses this site's address: ${text}`)
        assert(/RM\s?12\.90/.test(await page.getByTestId('order-est-total').innerText()), 'estimated total')
        await steps.getByTestId('chilled-notice').waitFor()
        await noSidewaysScroll(page)
        const left = (await page.getByTestId('order-send-whatsapp').boundingBox()).x
        assert(left >= 12, `order page has no side margin: x=${left}`)
        await page.screenshot({ path: `${SHOTS}/order-next-${width}-${lang}.png`, fullPage: true })
      }
    })

    if (width < 800) {
      await check(`${tag} sticky cart bar: count + total + checkout; never covers content; Categories button above it`, async () => {
        await page.goto(`${BASE_URL}/products`)
        const bar = page.getByTestId('mobile-cart-bar')
        if (!(await bar.isVisible().catch(() => false))) {
          // The order above emptied the cart: add the butter again.
          const butterName = lang === 'zh' ? '牛油 250克' : 'Butter 250g'
          await page.locator('div.group', { has: page.getByRole('heading', { name: butterName, exact: true }) }).first().click()
          await page.getByRole('button', { name: lang === 'zh' ? '加入购物车' : 'Add to cart' }).click()
          await page.goto(`${BASE_URL}/products`)
        }
        await bar.waitFor()
        const text = await bar.innerText()
        assert(/RM\s*\d+\.\d\d/.test(text) && /\d+ (items?|件)/.test(text), text)
        assert((await page.getByTestId('mobile-cart-checkout').innerText()).toLowerCase().includes(t.checkout.toLowerCase()), 'checkout label')
        // Scrolled to the very bottom, the last footer line sits above the bar.
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
        await sleep(300)
        const barTop = (await bar.boundingBox()).y
        const lastLine = await page.locator('footer a').last().boundingBox()
        assert(lastLine.y + lastLine.height <= barTop + 1, `footer covered: ${lastLine.y + lastLine.height} > ${barTop}`)
        // With the cart bar showing, the floating Categories button steps
        // aside (the Categories link stays in the results bar).
        assert(!(await page.locator('button.fixed', { hasText: /Categories|分类/ }).isVisible()), 'floating Categories button shown with the cart bar')
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

for (const width of [375, 1440]) {
  await check(`${width}px sale events: badge + sale price on the card; cart shows bundle and spend discounts; the server charges the same`, async () => {
    const page = await newPage(width)
    await page.goto(`${BASE_URL}/products`)
    const card = (name) => page.locator('div.group', { has: page.getByRole('heading', { name, exact: true }) }).first()
    await card('Cocoa powder').getByTestId('promo-badge').waitFor({ timeout: 20000 })
    assert((await card('Cocoa powder').getByTestId('promo-badge').innerText()).trim() === 'CLEARANCE', 'badge text')
    assert(/RM\s?8\.91/.test(await card('Cocoa powder').getByTestId('sale-price').innerText()), 'sale price 10% off 9.90')
    assert((await card('Rice flour').getByTestId('promo-badge').count()) === 0, 'ended sale not shown')
    // Butter only: the bundle prompt and the "almost there" nudge.
    await card('Butter 250g').click()
    await page.getByRole('button', { name: 'Add to cart' }).click()
    const drawer = page.locator('.fixed.inset-0.z-\\[100\\]')
    await drawer.getByTestId('mixmatch-prompt').waitFor()
    assert((await drawer.getByTestId('mixmatch-prompt').innerText()).includes('Add 1 more item(s) to get 2 for RM20!'), 'bundle prompt')
    assert(/RM 7\.10 more/.test(await drawer.getByTestId('threshold-prompt').innerText()), await drawer.getByTestId('threshold-prompt').innerText())
    await page.keyboard.press('Escape').catch(() => {})
    await page.goto(`${BASE_URL}/products`)
    await card('Cocoa powder').click()
    await page.getByRole('button', { name: 'Add to cart' }).click()
    // 12.90 + 8.91 = 21.81 -> bundle 20.00 (1.81 off) -> spend >= 20: 2.00 off -> 18.00
    await drawer.getByTestId('cart-total').waitFor()
    assert(/RM 18\.00/.test(await drawer.getByTestId('cart-total').innerText()), await drawer.getByTestId('cart-total').innerText())
    const lines = await drawer.getByTestId('cart-discount').allInnerTexts()
    assert(lines.length === 3 && lines.join('|').includes('−RM 2.00'), lines.join('|'))
    await page.screenshot({ path: `${SHOTS}/cart-sales-${width}.png` })
    await drawer.getByRole('button', { name: 'Continue to order' }).click()
    await page.waitForURL(/\/checkout/)
    assert(/RM 18\.00/.test(await page.getByTestId('checkout-total').innerText()), 'checkout total')
    await page.locator('#name').fill('Sale Test')
    // Its own number: this suite already sent several orders from 012-345 6789 (rate limit).
    await page.locator('#phone').fill(width === 375 ? '013-555 0101' : '013-555 0202')
    await page.locator('#collectTime').fill('10:00')
    await page.locator('form input[type=checkbox][required]').check()
    await sleep(3200)
    await page.getByRole('button', { name: 'Send order on WhatsApp' }).click()
    await page.waitForURL(/\/order\/SBH-/, { timeout: 20000 })
    assert(/RM\s?18\.00/.test(await page.getByTestId('order-est-total').innerText()), 'order page total = server total')
    await page.context().close()
  })
}

await check('no uncaught page errors', async () => {
  assert(pageErrors.length === 0, pageErrors.join(' | '))
})

await browser.close()
process.exit(summary() ? 1 : 0)
