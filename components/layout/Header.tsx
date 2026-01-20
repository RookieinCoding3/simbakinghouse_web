'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Helper to determine if link is active
  const isActive = (path: string) => pathname === path

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bakery-dark/98 backdrop-blur-md border-b border-bakery-accent/20 shadow-lg">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Brand Name - Left */}
          <Link
            href="/"
            className="group relative"
          >
            <div className="flex flex-col">
              <span className="font-heading text-bakery-cream text-2xl md:text-3xl lg:text-4xl tracking-wider group-hover:text-bakery-accent transition-colors duration-300">
                SIM BAKING
              </span>
              <span className="font-body text-bakery-accent text-xs md:text-sm italic tracking-widest -mt-1">
                HOUSE
              </span>
            </div>
            {/* Decorative underline */}
            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-bakery-accent group-hover:w-full transition-all duration-300"></div>
          </Link>

          {/* Desktop Navigation Links - Right Aligned */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={`group relative px-4 py-2 font-body text-base lg:text-lg transition-all duration-300 ${
                isActive('/')
                  ? 'text-bakery-accent'
                  : 'text-bakery-cream hover:text-bakery-accent'
              }`}
            >
              Home
              {isActive('/') && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-bakery-accent"></span>
              )}
              {!isActive('/') && (
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-bakery-accent group-hover:w-full transition-all duration-300"></span>
              )}
            </Link>
            <Link
              href="/products"
              className={`group relative px-4 py-2 font-body text-base lg:text-lg transition-all duration-300 ${
                isActive('/products')
                  ? 'text-bakery-accent'
                  : 'text-bakery-cream hover:text-bakery-accent'
              }`}
            >
              Products
              {isActive('/products') && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-bakery-accent"></span>
              )}
              {!isActive('/products') && (
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-bakery-accent group-hover:w-full transition-all duration-300"></span>
              )}
            </Link>
            <Link
              href="/about"
              className={`group relative px-4 py-2 font-body text-base lg:text-lg transition-all duration-300 ${
                isActive('/about')
                  ? 'text-bakery-accent'
                  : 'text-bakery-cream hover:text-bakery-accent'
              }`}
            >
              About
              {isActive('/about') && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-bakery-accent"></span>
              )}
              {!isActive('/about') && (
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-bakery-accent group-hover:w-full transition-all duration-300"></span>
              )}
            </Link>
            <Link
              href="/location"
              className={`group relative px-4 py-2 font-body text-base lg:text-lg transition-all duration-300 ${
                isActive('/location')
                  ? 'text-bakery-accent'
                  : 'text-bakery-cream hover:text-bakery-accent'
              }`}
            >
              Location
              {isActive('/location') && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-bakery-accent"></span>
              )}
              {!isActive('/location') && (
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-bakery-accent group-hover:w-full transition-all duration-300"></span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-bakery-cream hover:text-bakery-accent transition-colors duration-300 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-6 border-t border-bakery-accent/20 bg-bakery-dark/95">
            <div className="flex flex-col space-y-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`group relative px-6 py-3 font-body text-lg transition-all duration-300 ${
                  isActive('/')
                    ? 'text-bakery-accent bg-bakery-accent/10'
                    : 'text-bakery-cream hover:text-bakery-accent hover:bg-bakery-accent/5'
                }`}
              >
                <span className="flex items-center">
                  {isActive('/') && <span className="w-1 h-6 bg-bakery-accent mr-3 rounded-full"></span>}
                  Home
                </span>
              </Link>
              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className={`group relative px-6 py-3 font-body text-lg transition-all duration-300 ${
                  isActive('/products')
                    ? 'text-bakery-accent bg-bakery-accent/10'
                    : 'text-bakery-cream hover:text-bakery-accent hover:bg-bakery-accent/5'
                }`}
              >
                <span className="flex items-center">
                  {isActive('/products') && <span className="w-1 h-6 bg-bakery-accent mr-3 rounded-full"></span>}
                  Products
                </span>
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className={`group relative px-6 py-3 font-body text-lg transition-all duration-300 ${
                  isActive('/about')
                    ? 'text-bakery-accent bg-bakery-accent/10'
                    : 'text-bakery-cream hover:text-bakery-accent hover:bg-bakery-accent/5'
                }`}
              >
                <span className="flex items-center">
                  {isActive('/about') && <span className="w-1 h-6 bg-bakery-accent mr-3 rounded-full"></span>}
                  About
                </span>
              </Link>
              <Link
                href="/location"
                onClick={() => setMobileMenuOpen(false)}
                className={`group relative px-6 py-3 font-body text-lg transition-all duration-300 ${
                  isActive('/location')
                    ? 'text-bakery-accent bg-bakery-accent/10'
                    : 'text-bakery-cream hover:text-bakery-accent hover:bg-bakery-accent/5'
                }`}
              >
                <span className="flex items-center">
                  {isActive('/location') && <span className="w-1 h-6 bg-bakery-accent mr-3 rounded-full"></span>}
                  Location
                </span>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
