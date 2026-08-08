/** @type {import('next').NextConfig} */

// Report-Only for now: nothing is blocked yet, violations are just logged
// (browser DevTools console, and POSTed to /api/csp-report for real
// visitors). Flip the header key below to the enforcing name once a few
// days of reports come back clean.
//
// script-src/style-src include 'unsafe-inline' as a deliberate trade-off:
// Next.js injects inline hydration scripts on every page, and the fully
// "correct" nonce-based CSP requires per-request dynamic rendering, which
// would break the ISR caching on /products. This app renders no
// user-supplied HTML anywhere (search input is only ever used for string
// matching, never injected as markup), so the XSS surface 'unsafe-inline'
// actually gives up is low. Revisit if that ever changes.
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://firestore.googleapis.com https://firebaseinstallations.googleapis.com",
  "frame-src https://www.google.com",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
  'report-uri /api/csp-report',
].join('; ')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Content-Security-Policy-Report-Only', value: cspDirectives },
]

const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/avif', 'image/webp'],
  },
  // Generate unique build ID to bust browser cache
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
