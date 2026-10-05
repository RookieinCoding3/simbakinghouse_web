// The admin's own installable app manifest — scoped to /admin so the
// installed "SBH Admin" app never opens customer pages inside itself.
export const dynamic = 'force-static'

const manifest = {
  id: '/admin',
  name: 'SBH Admin',
  short_name: 'SBH Admin',
  start_url: '/admin',
  scope: '/admin',
  display: 'standalone',
  background_color: '#FAF8F5',
  theme_color: '#1F1D1B',
  icons: [
    { src: '/admin-icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/admin-icon-512.png', sizes: '512x512', type: 'image/png' },
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
