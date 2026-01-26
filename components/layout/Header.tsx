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
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  // Handle scroll effect with throttling
  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20)
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-bakery-dark/98 shadow-lg border-b border-bakery-accent/20'
          : 'bg-bakery-dark/95 backdrop-blur-md'
      }`}
    >
      {/* Increased height for better mobile tapping: h-20 on mobile, h-24 on desktop */}
      <nav className="container mx-auto px-6 h-20 md:h-24 flex items-center justify-between">
        {/* Brand - Larger and more prominent */}
        <Link href="/" className="group" onClick={() => setMobileMenuOpen(false)}>
          <h1 className="font-heading text-bakery-accent text-2xl md:text-3xl tracking-widest group-hover:tracking-[0.2em] transition-all duration-300">
            SIM BAKING HOUSE
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`font-body text-sm tracking-wide transition-colors duration-200 ${
                isActive(item.path)
                  ? 'text-bakery-accent'
                  : 'text-bakery-cream/80 hover:text-bakery-accent'
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
            className="px-6 py-2.5 bg-bakery-accent hover:bg-bakery-accent/90 text-bakery-dark font-heading text-sm tracking-wider rounded transition-colors duration-200"
          >
            ORDER NOW
          </a>
        </div>

        {/* REFINED Mobile Menu Button - Bigger, Visible, High Contrast */}
        <button
          className="lg:hidden p-3 -mr-2 text-bakery-cream bg-white/10 hover:bg-white/20 rounded-full border border-white/20 transition-all duration-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            // X Icon - 28px for better visibility
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            // Menu Icon - 28px for better visibility
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Full-Screen Mobile Menu Overlay */}
      <div
        className={`lg:hidden fixed inset-0 top-20 bg-bakery-dark z-50 transition-all duration-500 ease-out ${
          mobileMenuOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="h-full flex flex-col p-10 space-y-6">
          {NAV_ITEMS.map((item, index) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`font-heading text-5xl uppercase tracking-tight transition-all duration-300 ${
                isActive(item.path)
                  ? 'text-bakery-accent'
                  : 'text-bakery-cream hover:text-bakery-accent hover:translate-x-2'
              }`}
              style={{
                transitionDelay: mobileMenuOpen ? `${index * 75}ms` : '0ms',
                opacity: mobileMenuOpen ? 1 : 0,
                transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-20px)'
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
            className="mt-auto mb-10 py-5 bg-bakery-accent hover:bg-bakery-accent/90 text-bakery-dark font-heading text-xl tracking-[0.2em] rounded-sm text-center transition-all duration-300"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              transitionDelay: mobileMenuOpen ? '300ms' : '0ms',
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
