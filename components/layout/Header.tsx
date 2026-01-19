'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }

  // Helper to determine if link is active
  const isActive = (path: string) => pathname === path

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bakery-brown/95 backdrop-blur-sm border-b border-bakery-cream/20">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="hover:opacity-80 transition-opacity duration-200"
          >
            <Image
              src="/SBH_logo.svg"
              alt="Sim Baking House"
              width={160}
              height={56}
              className="object-contain w-32 h-12 md:w-40 md:h-14"
              style={{ filter: 'brightness(0) saturate(100%) invert(94%) sepia(8%) saturate(401%) hue-rotate(356deg) brightness(101%) contrast(93%)' }}
              priority
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`font-body transition-colors duration-200 ${
                isActive('/')
                  ? 'text-bakery-accent'
                  : 'text-bakery-cream hover:text-bakery-accent'
              }`}
            >
              Home
            </Link>
            <Link
              href="/products"
              className={`font-body transition-colors duration-200 ${
                isActive('/products')
                  ? 'text-bakery-accent'
                  : 'text-bakery-cream hover:text-bakery-accent'
              }`}
            >
              Products
            </Link>
            {pathname === '/' ? (
              <button
                onClick={() => scrollToSection('about')}
                className="font-body text-bakery-cream hover:text-bakery-accent transition-colors duration-200"
              >
                About
              </button>
            ) : (
              <Link
                href="/#about"
                className="font-body text-bakery-cream hover:text-bakery-accent transition-colors duration-200"
              >
                About
              </Link>
            )}
            <Link
              href="/location"
              className={`font-body transition-colors duration-200 ${
                isActive('/location')
                  ? 'text-bakery-accent'
                  : 'text-bakery-cream hover:text-bakery-accent'
              }`}
            >
              Location
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-bakery-cream"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
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
          <div className="md:hidden py-4 border-t border-bakery-cream/20">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-body text-lg transition-colors duration-200 ${
                  isActive('/')
                    ? 'text-bakery-accent'
                    : 'text-bakery-cream hover:text-bakery-accent'
                }`}
              >
                Home
              </Link>
              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-body text-lg transition-colors duration-200 ${
                  isActive('/products')
                    ? 'text-bakery-accent'
                    : 'text-bakery-cream hover:text-bakery-accent'
                }`}
              >
                Products
              </Link>
              {pathname === '/' ? (
                <button
                  onClick={() => scrollToSection('about')}
                  className="font-body text-lg text-left text-bakery-cream hover:text-bakery-accent transition-colors duration-200"
                >
                  About
                </button>
              ) : (
                <Link
                  href="/#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-body text-lg text-bakery-cream hover:text-bakery-accent transition-colors duration-200"
                >
                  About
                </Link>
              )}
              <Link
                href="/location"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-body text-lg transition-colors duration-200 ${
                  isActive('/location')
                    ? 'text-bakery-accent'
                    : 'text-bakery-cream hover:text-bakery-accent'
                }`}
              >
                Location
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
