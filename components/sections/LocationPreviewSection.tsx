'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function LocationPreviewSection() {
  const [isOpen, setIsOpen] = useState(false)
  const [closingTime, setClosingTime] = useState('')

  useEffect(() => {
    const checkOpenStatus = () => {
      const now = new Date()
      const day = now.getDay() // 0 = Sunday, 1 = Monday, etc.
      const hour = now.getHours()
      const minute = now.getMinutes()
      const currentTime = hour * 60 + minute // Convert to minutes

      // Monday-Saturday: 8:00-19:00 (480-1140 minutes)
      // Sunday: 9:00-17:00 (540-1020 minutes)
      if (day === 0) {
        // Sunday
        setIsOpen(currentTime >= 540 && currentTime < 1020)
        setClosingTime('5:00 PM')
      } else {
        // Monday-Saturday
        setIsOpen(currentTime >= 480 && currentTime < 1140)
        setClosingTime('7:00 PM')
      }
    }

    checkOpenStatus()
    const interval = setInterval(checkOpenStatus, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-16 md:py-24 bg-bakery-cream paper-texture">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden transform hover:scale-[1.01] transition-transform duration-500">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left: Status & Hours */}
            <div className="p-10 md:p-12 bg-gradient-to-br from-bakery-accent/10 via-bakery-cream/50 to-transparent">
              {/* Status Badge */}
              <div className="mb-10">
                <div className={`inline-flex items-center space-x-2.5 px-5 py-2.5 rounded-full shadow-md ${
                  isOpen
                    ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                    : 'bg-red-500/20 text-red-700 border border-red-500/30'
                }`}>
                  <span className={`w-3 h-3 rounded-full ${
                    isOpen ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' : 'bg-red-500'
                  }`}></span>
                  <span className="font-heading text-sm tracking-wider font-semibold">
                    {isOpen ? `Open Now • Until ${closingTime}` : 'Currently Closed'}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h2 className="font-heading text-bakery-brown text-3xl md:text-4xl mb-8 tracking-wide">
                VISIT US IN PENANG
              </h2>

              {/* Opening Hours */}
              <div className="space-y-3 mb-8">
                <h3 className="font-heading text-bakery-brown/80 text-lg mb-4">
                  OPENING HOURS
                </h3>
                <div className="space-y-2 font-body text-bakery-brown/80">
                  <div className="flex justify-between items-center">
                    <span>Monday - Saturday</span>
                    <span className="font-semibold">08:00 - 19:00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Sunday</span>
                    <span className="font-semibold">09:00 - 17:00</span>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="flex items-start space-x-3 text-bakery-brown/70 mb-6">
                <svg className="w-5 h-5 mt-1 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="font-body text-sm leading-relaxed">
                    Penang, Malaysia<br />
                    <span className="text-xs text-bakery-brown/50">5.3236612, 100.2703337</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Map Preview & CTA */}
            <div className="relative bg-gradient-to-br from-bakery-dark via-bakery-brown to-bakery-dark flex flex-col items-center justify-center p-10 md:p-12">
              {/* Map Icon/Illustration */}
              <div className="w-36 h-36 mb-8 relative">
                <div className="absolute inset-0 bg-bakery-accent/30 rounded-full animate-pulse"></div>
                <div className="absolute inset-4 bg-bakery-accent/50 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute inset-8 bg-bakery-accent/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-18 h-18 text-bakery-accent drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-4.198 0-8 3.403-8 7.602 0 4.198 3.469 9.21 8 16.398 4.531-7.188 8-12.2 8-16.398 0-4.199-3.801-7.602-8-7.602zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z"/>
                  </svg>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-4 w-full max-w-sm">
                <Link
                  href="/location"
                  className="group block w-full bg-bakery-accent hover:bg-bakery-accent/90 text-bakery-dark font-heading px-8 py-4 rounded-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-bakery-accent/50 text-center tracking-widest transform hover:scale-105"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>GET DIRECTIONS</span>
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </Link>

                <a
                  href="tel:+60123456789"
                  className="block w-full bg-transparent hover:bg-bakery-cream/10 text-bakery-cream border-2 border-bakery-accent hover:border-bakery-cream font-heading px-8 py-4 rounded-lg transition-all duration-300 text-center tracking-widest hover:shadow-lg"
                >
                  CALL US
                </a>
              </div>

              {/* Quick Contact */}
              <div className="mt-8 text-center">
                <p className="font-body text-bakery-cream/60 text-xs mb-2">
                  Or reach us on
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <a
                    href="https://wa.me/60123456789"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bakery-cream/80 hover:text-bakery-accent transition-colors"
                    aria-label="WhatsApp"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </a>
                  <a
                    href="https://facebook.com/simbakinghouse"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bakery-cream/80 hover:text-bakery-accent transition-colors"
                    aria-label="Facebook"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <a
                    href="https://instagram.com/simbakinghouse"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bakery-cream/80 hover:text-bakery-accent transition-colors"
                    aria-label="Instagram"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
