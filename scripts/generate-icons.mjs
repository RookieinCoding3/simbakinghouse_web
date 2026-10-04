// One-off icon generation from public/SBH_tab.png (1024x1024, opaque, square).
// Run with: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { writeFileSync } from 'fs'

const SOURCE = 'public/SBH_tab.png'
const PAPER_BG = { r: 250, g: 248, b: 245, alpha: 1 } // matches tailwind.config.ts `paper` (#FAF8F5)

async function square(size, outPath) {
  await sharp(SOURCE).resize(size, size).png().toFile(outPath)
  console.log(`wrote ${outPath} (${size}x${size})`)
}

// --- Standard square icons (public/, used by app/manifest.ts) ---
await square(48, 'public/icon-48.png')
await square(96, 'public/icon-96.png')
await square(192, 'public/icon-192.png')
await square(512, 'public/icon-512.png')

// --- Maskable icon: artwork confined to the center 80% safe zone, solid
// background filling the rest of the canvas edge-to-edge (Android crops up
// to ~10% from each side depending on launcher mask shape). ---
const MASK_SIZE = 512
const SAFE_ZONE = Math.round(MASK_SIZE * 0.8) // 410px — content area
const artwork = await sharp(SOURCE).resize(SAFE_ZONE, SAFE_ZONE).png().toBuffer()
await sharp({
  create: { width: MASK_SIZE, height: MASK_SIZE, channels: 4, background: PAPER_BG },
})
  .composite([{ input: artwork, gravity: 'center' }])
  .png()
  .toFile('public/maskable-512.png')
console.log(`wrote public/maskable-512.png (${MASK_SIZE}x${MASK_SIZE}, ${SAFE_ZONE}x${SAFE_ZONE} safe zone)`)

// --- App Router convention files ---
await square(180, 'app/apple-icon.png') // apple-touch-icon, must stay opaque — iOS fills transparency with black
await square(512, 'app/icon.png') // Next scales this down itself for the <link> tag

// --- favicon.ico: a real multi-resolution ICO (16/32/48), each frame PNG-
// compressed. Not "hand-edited" — every pixel comes from sharp; this just
// packs sharp's own PNG output into the ICO container format, which has
// supported embedded PNG frames (instead of raw BMP) since Windows Vista. ---
const icoSizes = [16, 32, 48]
const icoFrames = await Promise.all(icoSizes.map((s) => sharp(SOURCE).resize(s, s).png().toBuffer()))

function buildIco(frames, sizes) {
  const HEADER_SIZE = 6
  const ENTRY_SIZE = 16
  const header = Buffer.alloc(HEADER_SIZE)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(frames.length, 4)

  const entries = Buffer.alloc(ENTRY_SIZE * frames.length)
  let offset = HEADER_SIZE + ENTRY_SIZE * frames.length
  frames.forEach((frame, i) => {
    const size = sizes[i]
    const base = i * ENTRY_SIZE
    entries.writeUInt8(size === 256 ? 0 : size, base + 0) // width (0 = 256)
    entries.writeUInt8(size === 256 ? 0 : size, base + 1) // height
    entries.writeUInt8(0, base + 2) // color palette
    entries.writeUInt8(0, base + 3) // reserved
    entries.writeUInt16LE(1, base + 4) // color planes
    entries.writeUInt16LE(32, base + 6) // bits per pixel
    entries.writeUInt32LE(frame.length, base + 8) // byte size
    entries.writeUInt32LE(offset, base + 12) // byte offset
    offset += frame.length
  })

  return Buffer.concat([header, entries, ...frames])
}

const ico = buildIco(icoFrames, icoSizes)
writeFileSync('app/favicon.ico', ico)
console.log(`wrote app/favicon.ico (${icoSizes.join('/')})`)

console.log('\nDone.')
