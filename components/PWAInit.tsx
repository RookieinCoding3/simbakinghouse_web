'use client'

import { useEffect } from 'react'

/** Mounted once in the root layout. Registers the service worker
 *  (public/sw.js) so the site is installable with an offline fallback.
 *  Production-only: a cached service worker during development would
 *  fight next dev's own HMR/caching. */
export default function PWAInit() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])
  return null
}
