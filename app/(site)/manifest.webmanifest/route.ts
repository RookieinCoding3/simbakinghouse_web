// The shop's web app manifest, at the same URL as before (/manifest.webmanifest)
// so already-installed home-screen apps keep working. Served from the (site)
// route group rather than the root app/manifest.ts convention: that
// convention links itself into EVERY root layout, including the admin's,
// which has its own manifest (app/(admin)/admin/manifest.webmanifest).
//
// Colors taken directly from tailwind.config.ts: background_color = `paper`
// (#FAF8F5), theme_color = `clay` (#7A4031).
export const dynamic = 'force-static'

const manifest = {
  name: 'Sim Baking House',
  short_name: 'Sim Baking House',
  description: 'Baking supplies and premix shop in Bayan Lepas, Penang.',
  id: '/',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  lang: 'en-MY',
  background_color: '#FAF8F5',
  theme_color: '#7A4031',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}

export function GET() {
  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
