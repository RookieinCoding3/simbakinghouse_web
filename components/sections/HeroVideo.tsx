'use client'

import { useEffect, useState } from 'react'

// Run scripts/upload-hero-video.mjs (see its header comment) and paste the
// printed Firebase Storage URL here — moves the video's bytes off Vercel's
// CDN entirely. Until then this still works, just still served by Vercel.
const HERO_VIDEO_URL = '/landing_page.mp4'

const MOBILE_BREAKPOINT_PX = 768

/** Chromium only — Safari/Firefox simply don't expose this, in which case
 *  `undefined` falls through to "assume a normal connection" rather than
 *  silently disabling video for every non-Chromium visitor. */
function hasSlowConnection(): boolean {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string }
  }
  const conn = nav.connection
  if (!conn) return false
  if (conn.saveData) return true
  return conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.effectiveType === '3g'
}

/**
 * The poster image is what the server renders and what every visitor sees
 * first, full stop — this only ever adds a <video> on top of it, after
 * mount, and only for a visitor who is neither on a small screen nor on a
 * connection that says it's slow. A mobile visitor or a slow connection
 * never fetches a single byte of video, not even preload="metadata".
 */
export default function HeroVideo() {
  const [showVideo, setShowVideo] = useState(false)

  useEffect(() => {
    const isSmallScreen = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`).matches
    if (!isSmallScreen && !hasSlowConnection()) {
      setShowVideo(true)
    }
  }, [])

  if (!showVideo) return null

  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster="/images/hero-poster.jpg"
      aria-hidden="true"
      className="absolute inset-0 w-full h-full object-cover"
    >
      <source src={HERO_VIDEO_URL} type="video/mp4" />
    </video>
  )
}
