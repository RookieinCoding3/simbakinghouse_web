// One-off: admin app icons — the shop mark on a dark ink tile with an
// "ADMIN" band, so the installed admin app is never confused with the shop.
// Run with: node scripts/generate-admin-icons.mjs
import sharp from 'sharp'

const SOURCE = 'public/SBH_tab.png'
const INK = { r: 31, g: 29, b: 27, alpha: 1 } // tailwind `ink` #1F1D1B

async function make(size, outPath) {
  const markSize = Math.round(size * 0.62)
  const mark = await sharp(SOURCE).resize(markSize, markSize).png().toBuffer()
  const band = Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="${Math.round(size * 0.76)}" width="${size}" height="${Math.round(size * 0.24)}" fill="#7A4031"/>
      <text x="50%" y="${Math.round(size * 0.925)}" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-weight="700"
        font-size="${Math.round(size * 0.13)}" letter-spacing="${Math.round(size * 0.02)}" fill="#FAF8F5">ADMIN</text>
    </svg>`)
  await sharp({ create: { width: size, height: size, channels: 4, background: INK } })
    .composite([
      { input: mark, top: Math.round(size * 0.07), left: Math.round((size - markSize) / 2) },
      { input: band, top: 0, left: 0 },
    ])
    .png()
    .toFile(outPath)
  console.log(`wrote ${outPath}`)
}

await make(180, 'public/admin-apple-icon.png')
await make(192, 'public/admin-icon-192.png')
await make(512, 'public/admin-icon-512.png')
