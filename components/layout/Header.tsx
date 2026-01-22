'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  // Handle scroll effect for background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-bakery-dark shadow-2xl border-b border-bakery-accent/30'
          : 'bg-bakery-dark/95 backdrop-blur-md border-b border-bakery-cream/10'
      }`}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Logo + Brand */}
          <Link href="/" className="group flex items-center space-x-3 md:space-x-4">
            {/* Logo Icon */}
            <div className="relative w-12 h-12 md:w-14 md:h-14 transform group-hover:scale-110 transition-transform duration-300">
              <Image
                src="/images/SBH_logo.svg"
                alt="Sim Baking House Logo"
                fill
                className="object-contain"
                style={{ filter: 'brightness(0) saturate(100%) invert(73%) sepia(25%) saturate(724%) hue-rotate(358deg) brightness(92%) contrast(87%)' }}
                priority
              />
            </div>

            {/* Brand Name */}
            <div className="flex flex-col">
              <h1 className="font-heading text-bakery-accent text-xl md:text-2xl lg:text-3xl tracking-[0.15em] group-hover:tracking-[0.2em] transition-all duration-300 leading-none">
                SIM BAKING HOUSE
              </h1>
              <p className="font-body text-bakery-cream/60 text-[10px] md:text-xs tracking-widest uppercase mt-0.5 md:mt-1">
                Est. 2017 • Penang
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {[
              { name: 'Home', path: '/' },
              { name: 'About', path: '/about' },
              { name: 'Products', path: '/products' },
              { name: 'Location', path: '/location' },
            ].map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`relative px-4 xl:px-5 py-2 font-body text-sm xl:text-base tracking-wide transition-all duration-300 group ${
                  isActive(item.path)
                    ? 'text-bakery-accent'
                    : 'text-bakery-cream hover:text-bakery-accent'
                }`}
              >
                {item.name}
                {/* Underline animation */}
                <span
                  className={`absolute bottom-0 left-0 w-full h-0.5 bg-bakery-accent transform origin-left transition-transform duration-300 ${
                    isActive(item.path) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                ></span>
              </Link>
            ))}

            {/* Order Now CTA Button */}
            <a
              href={process.env.NEXT_PUBLIC_GOOGLE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 xl:ml-6 px-6 xl:px-8 py-2.5 bg-bakery-accent hover:bg-bakery-accent/90 text-bakery-dark font-heading text-sm xl:text-base tracking-wider rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-bakery-accent/50 hover-scale"
            >
              ORDER NOW
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden relative w-10 h-10 text-bakery-cream flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="relative w-6 h-5 flex flex-col justify-between">
              <span
                className={`block w-full h-0.5 bg-current transform transition-all duration-300 ${
                  mobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              ></span>
              <span
                className={`block w-full h-0.5 bg-current transition-all duration-300 ${
                  mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}
              ></span>
              <span
                className={`block w-full h-0.5 bg-current transform transition-all duration-300 ${
                  mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              ></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu - Slide Down */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-500 ease-in-out ${
            mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-6 border-t border-bakery-cream/10">
            <div className="flex flex-col space-y-1">
              {[
                { name: 'Home', path: '/' },
                { name: 'About Us', path: '/about' },
                { name: 'Products', path: '/products' },
                { name: 'Location', path: '/location' },
              ].map((item, index) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 font-body text-lg tracking-wide transition-all duration-300 rounded-lg ${
                    isActive(item.path)
                      ? 'text-bakery-accent bg-bakery-accent/10'
                      : 'text-bakery-cream hover:text-bakery-accent hover:bg-bakery-cream/5'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Order Button */}
              <a
                href={process.env.NEXT_PUBLIC_GOOGLE_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 mx-4 px-6 py-3 bg-bakery-accent hover:bg-bakery-accent/90 text-bakery-dark font-heading text-base tracking-wider rounded-full transition-all duration-300 text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                ORDER NOW
              </a>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
