'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useScrollThrottle } from '@/lib/hooks/useScrollThrottle'

// Navigation menu items
const NAV_ITEMS = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Products', path: '/products' },
  { name: 'Location', path: '/location' },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  // Handle scroll effect with throttling
  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 20)
  }, [])

  useScrollThrottle(handleScroll, 100)

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-bakery-dark/95 backdrop-blur-xl py-3 border-b border-bakery-accent/20 shadow-lg'
          : 'bg-gradient-to-b from-bakery-dark/80 to-transparent py-4 md:py-6'
      }`}
    >
      <nav className="container mx-auto px-6 flex items-center justify-between">
        {/* Brand with Logo */}
        <Link href="/" className="group flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
          <div className="relative h-12 md:h-14 w-auto">
            <img
              src="/SBH_logo.svg"
              alt="Sim Baking House"
              className="h-full w-auto object-contain filter drop-shadow-[0_0_8px_rgba(212,165,116,0.3)] group-hover:drop-shadow-[0_0_12px_rgba(212,165,116,0.5)] transition-all duration-300"
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`font-body text-sm tracking-wide transition-all duration-300 hover:translate-y-[-2px] ${
                isActive(item.path)
                  ? 'text-bakery-accent'
                  : 'text-bakery-cream/70 hover:text-bakery-accent'
              }`}
            >
              {item.name}
            </Link>
          ))}

          {/* Order Now CTA Button */}
          <a
            href={process.env.NEXT_PUBLIC_GOOGLE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 bg-bakery-accent hover:bg-bakery-accent/90 text-bakery-dark font-heading text-sm tracking-wider rounded-full shadow-[0_0_20px_rgba(212,165,116,0.3)] hover:shadow-[0_0_30px_rgba(212,165,116,0.5)] transition-all duration-300"
          >
            ORDER NOW
          </a>
        </div>

        {/* HIGH CONTRAST Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden w-12 h-12 flex items-center justify-center bg-bakery-accent/10 border border-bakery-accent/30 rounded-full text-bakery-accent active:scale-90 hover:bg-bakery-accent/20 transition-all duration-300"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Full-Screen Mobile Menu with Glassmorphism */}
      <div
        className={`lg:hidden fixed inset-0 top-0 bg-bakery-dark/98 backdrop-blur-xl z-40 transition-all duration-500 ease-out ${
          mobileMenuOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        {/* Close button inside menu */}
        <div className="absolute top-4 right-6">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-12 h-12 flex items-center justify-center bg-bakery-accent/10 border border-bakery-accent/30 rounded-full text-bakery-accent"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="h-full flex flex-col justify-center px-10 space-y-8">
          {NAV_ITEMS.map((item, index) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`font-heading text-5xl uppercase tracking-tight transition-all duration-500 ${
                isActive(item.path)
                  ? 'text-bakery-accent'
                  : 'text-bakery-cream hover:text-bakery-accent hover:translate-x-4'
              }`}
              style={{
                transitionDelay: mobileMenuOpen ? `${index * 75}ms` : '0ms',
                opacity: mobileMenuOpen ? 1 : 0,
                transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-30px)'
              }}
            >
              {item.name}
            </Link>
          ))}

          {/* Mobile Order Button */}
          <a
            href={process.env.NEXT_PUBLIC_GOOGLE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 py-5 bg-bakery-accent hover:bg-bakery-accent/90 text-bakery-dark font-heading text-xl tracking-[0.2em] rounded-full text-center shadow-[0_0_30px_rgba(212,165,116,0.4)] transition-all duration-300"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              transitionDelay: mobileMenuOpen ? '350ms' : '0ms',
              opacity: mobileMenuOpen ? 1 : 0
            }}
          >
            ORDER NOW
          </a>
        </div>
      </div>
    </header>
  )
}
