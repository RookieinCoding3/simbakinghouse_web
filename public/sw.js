// Minimal service worker: makes the site installable with a real offline
// fallback and speeds up repeat visits by caching static assets. Deliberately
// does NOT cache anything under /api/ — orders, order status, settings and
// analytics must always hit the network, never serve stale or cached data.
const CACHE_NAME = 'sbh-static-v2'
const OFFLINE_URL = '/offline.html'

const PRECACHE_URLS = [
  OFFLINE_URL,
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

const CACHEABLE_STATIC = /\.(?:png|jpe?g|svg|webp|avif|ico|woff2?)$/

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  // Page navigations: always prefer the network (so menu/prices/order
  // status are never stale); fall back to the offline page if it fails.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)))
    return
  }

  // Static assets: cache-first, refreshed in the background.
  if (CACHEABLE_STATIC.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
            return response
          })
          .catch(() => cached)
        return cached || fetchPromise
      })
    )
  }
})
