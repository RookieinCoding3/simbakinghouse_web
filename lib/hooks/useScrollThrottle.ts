import { useEffect, useRef } from 'react'

/**
 * Custom hook to throttle scroll event handlers
 * @param callback - Function to call on scroll
 * @param delay - Throttle delay in milliseconds (default: 100ms)
 */
export function useScrollThrottle(callback: () => void, delay: number = 100) {
  const lastRun = useRef(Date.now())

  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now()

      if (now - lastRun.current >= delay) {
        callback()
        lastRun.current = now
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    // Call once on mount
    callback()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [callback, delay])
}
