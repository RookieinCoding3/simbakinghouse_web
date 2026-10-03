'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import CartButton from '@/components/cart/CartButton'
import AccountButton from '@/components/auth/AccountButton'

// Navigation menu items
const NAV_ITEMS = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Products', path: '/products' },
  { name: 'Location', path: '/location' },
]

const MOBILE_MENU_ID = 'mobile-nav-panel'
// Must match the header's h-16 (64px) — the portaled panel isn't a DOM
// child of the header anymore, so it can't inherit its height and has to
// pad itself below it explicitly instead.
const HEADER_HEIGHT_PX = 64

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const previousPathname = useRef(pathname)

  const isActive = (path: string) => pathname === path

  // createPortal needs document.body, which doesn't exist during SSR.
  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  // Close on route change (e.g. browser back/forward while open — a link
  // tap already closes it directly via its own onClick).
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname
      setMobileMenuOpen(false)
    }
  }, [pathname])

  // Close on Escape.
  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileMenuOpen])

  return (
    <header className="sticky top-0 z-50 w-full h-16 border-b border-line bg-paper/90 backdrop-blur-sm">
      <nav className="h-full max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-[1fr_auto_1fr] items-center text-xs tracking-wider">
        {/* Nav Left */}
        <div className="hidden lg:flex items-center gap-7">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'transition-colors duration-200',
                isActive(item.path) ? 'text-ink' : 'text-muted hover:text-ink'
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Mobile menu toggle (left) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden justify-self-start -ml-2 w-11 h-11 flex items-center justify-center text-ink"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls={MOBILE_MENU_ID}
        >
          {mobileMenuOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
            </svg>
          )}
        </button>

        {/* Center wordmark */}
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="text-center font-medium tracking-[0.25em] text-[11px] sm:text-sm uppercase text-ink whitespace-nowrap"
        >
          Sim · Baking · House
        </Link>

        {/* Right: account + cart */}
        <div className="flex justify-end items-center">
          <AccountButton />
          <CartButton />
        </div>
      </nav>

      {/* Mobile menu panel — portaled to document.body so the header's own
          backdrop-blur (which makes the header a containing block for any
          position:fixed descendant) can't collapse this panel's fixed
          positioning down to the header's own 64px height. Kept at a lower
          z-index than the header (z-50) so the header's logo/close/cart
          stay visibly on top of the panel wherever they overlap it. */}
      {mounted &&
        createPortal(
          <div
            id={MOBILE_MENU_ID}
            className={cn(
              'lg:hidden fixed inset-0 h-dvh z-40 bg-paper transition-opacity duration-300',
              mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
            )}
            style={{
              paddingTop: `calc(${HEADER_HEIGHT_PX}px + env(safe-area-inset-top))`,
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            <div className="h-full flex flex-col justify-center px-10 gap-2 overflow-y-auto">
              {NAV_ITEMS.map((item, index) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'min-h-[56px] flex items-center font-heading text-5xl transition-all duration-500',
                    isActive(item.path) ? 'text-clay' : 'text-ink hover:text-clay'
                  )}
                  style={{
                    transitionDelay: mobileMenuOpen ? `${index * 60}ms` : '0ms',
                    opacity: mobileMenuOpen ? 1 : 0,
                    transform: mobileMenuOpen ? 'translateY(0)' : 'translateY(10px)',
                  }}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>,
          document.body
        )}
    </header>
  )
}
