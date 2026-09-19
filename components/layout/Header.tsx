'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

// Navigation menu items
const NAV_ITEMS = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Products', path: '/products' },
  { name: 'Location', path: '/location' },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset'
    return () => {
      document.body.style.overflow = 'unset'
    }
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
          className="lg:hidden justify-self-start -ml-2 w-10 h-10 flex items-center justify-center text-ink"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
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

        {/* Right CTA */}
        <div className="flex justify-end">
          <a
            href={process.env.NEXT_PUBLIC_GOOGLE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] sm:text-xs uppercase tracking-widest text-ink hover:text-clay inline-flex items-center gap-1.5 font-medium transition-colors"
          >
            Order <span className="hidden sm:inline">online</span> <span className="text-sm">&rarr;</span>
          </a>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn(
          'lg:hidden fixed inset-x-0 top-16 bottom-0 bg-paper z-40 transition-opacity duration-300',
          mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        )}
      >
        <div className="h-full flex flex-col justify-center px-10 gap-6">
          {NAV_ITEMS.map((item, index) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'font-heading text-5xl transition-all duration-500',
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
      </div>
    </header>
  )
}
