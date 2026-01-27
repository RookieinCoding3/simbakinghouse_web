'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useScrollThrottle } from '@/lib/hooks/useScrollThrottle'
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
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  // Handle scroll - switch to solid header after 50px
  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 50)
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
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        // THE FIX: Switch background based on scroll for visibility on light sections
        isScrolled
          ? "bg-bakery-dark py-4 shadow-xl border-b border-bakery-accent/20"
          : "bg-transparent py-6"
      )}
    >
      <nav className="container mx-auto px-6 flex items-center justify-between">
        {/* Brand - Text Only */}
        <Link
          href="/"
          className="font-heading text-bakery-accent text-xl md:text-2xl tracking-[0.2em] hover:text-bakery-cream transition-colors duration-300"
          onClick={() => setMobileMenuOpen(false)}
        >
          SIM BAKING HOUSE
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "font-body text-sm tracking-wide transition-all duration-300 hover:translate-y-[-2px]",
                isActive(item.path)
                  ? "text-bakery-accent"
                  : "text-bakery-cream/70 hover:text-bakery-accent"
              )}
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

        {/* HIGH CONTRAST Mobile Menu Toggle - Always Visible */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden w-12 h-12 flex items-center justify-center bg-bakery-accent text-bakery-brown rounded-full shadow-lg active:scale-90 transition-all duration-300"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Full-Screen Mobile Menu */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 top-0 bg-bakery-dark z-40 transition-all duration-500 ease-out",
          mobileMenuOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible"
        )}
      >
        {/* Close button inside menu */}
        <div className="absolute top-6 right-6">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-12 h-12 flex items-center justify-center bg-bakery-accent text-bakery-brown rounded-full shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
              className={cn(
                "font-heading text-5xl uppercase tracking-tight transition-all duration-500",
                isActive(item.path)
                  ? "text-bakery-accent"
                  : "text-bakery-cream hover:text-bakery-accent hover:translate-x-4"
              )}
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
