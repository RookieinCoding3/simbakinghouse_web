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
  // apis.google.com: Google Identity's gapi.js, loaded by firebase/auth's
  // GoogleAuthProvider popup flow. va.vercel-scripts.com: @vercel/analytics.
  "script-src 'self' 'unsafe-inline' https://apis.google.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  // firebasestorage.googleapis.com: the DuitNow QR on the order-status page
  // is a signed Storage URL loaded via a plain <img>, not next/image.
  "img-src 'self' data: https://firebasestorage.googleapis.com",
  "font-src 'self'",
  // identitytoolkit/securetoken: Firebase Auth's own REST calls (email,
  // Google, token refresh). www.googleapis.com: Google Identity's gapi
  // config/loader requests that accompany the popup flow.
  "connect-src 'self' https://firestore.googleapis.com https://firebaseinstallations.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com",
  // sim-baking-house.firebaseapp.com: Firebase Auth's own hidden iframe,
  // used to persist sign-in state across the popup flow.
  "frame-src https://www.google.com https://sim-baking-house.firebaseapp.com",
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
  // firebase-admin (and its deps: @grpc/grpc-js, google-auth-library,
  // protobufjs, etc.) uses dynamic requires and optional native bindings
  // that break when Next tries to bundle them into each route's
  // serverless function. This tells Next to leave it as a normal
  // node_modules require instead — required for every route that imports
  // lib/firebase/admin.ts to work when actually deployed (not reproduced
  // by `next dev` or even a local `next build`, only by the deployed
  // serverless packaging itself).
  serverExternalPackages: ['firebase-admin'],
  images: {
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/avif', 'image/webp'],
    // Default is 60s, so Vercel's image optimizer re-serves (and the
    // browser re-validates) the exact same resized variant every minute —
    // 31 days matches Next's own documented example for production. A
    // photo replaced in Storage mid-window stays stale for up to that
    // long; worth knowing, not worth losing this cache over.
    minimumCacheTTL: 2678400,
    // Trimmed from Next's default 8 device widths (640–3840): nothing on
    // this site ever renders past the 1400px max-width container, so
    // 1920/2048/3840 were variants nothing would ever request — fewer
    // possible widths means a better cache-hit rate on the ones that are.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
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
      // public/ files (images, the hero video, icons, fonts) have no
      // content hash in their URL, unlike _next/static/* which Next
      // already serves as max-age=31536000, immutable by itself — without
      // this, Vercel's default for a plain public/ file is max-age=0,
      // meaning every single load revalidates. These filenames only
      // change via a new deploy (and in practice almost never do), so a
      // year-long immutable cache is safe; if one of these assets'
      // *content* ever needs to change, rename the file rather than
      // overwrite it in place, so the new URL isn't still-cached.
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|webp|avif|ico|mp4|webm|woff|woff2|ttf|otf)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
  // One canonical host: www. Matches SITE_URL in lib/site.ts and every
  // canonical/og:url tag — without this, the apex domain serves duplicate
  // content under a second host, splitting SEO signal between the two.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'simbakinghouse.com.my' }],
        destination: 'https://www.simbakinghouse.com.my/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
