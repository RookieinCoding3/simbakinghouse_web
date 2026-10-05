// Customer-site screenshots (390 + 1440) for the "site visually unchanged" check.
// Usage: node scripts/site-screenshots.mjs <outDir>   (needs a server on :3000)
import { chromium } from 'playwright'
const out = process.argv[2]
const browser = await chromium.launch()
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  for (const path of ['/', '/products', '/checkout', '/privacy', '/about']) {
    await page.goto('http://localhost:3000' + path, { waitUntil: 'load' })
    await page.waitForTimeout(2500)
    const name = (path === '/' ? 'home' : path.slice(1)) + `-${w}.png`
    await page.screenshot({ path: `${out}/${name}`, fullPage: true })
  }
  await page.close()
}
await browser.close()
console.log('saved to', out)
