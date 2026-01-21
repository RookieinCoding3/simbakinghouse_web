'use client'

import { useState, useEffect } from 'react'

export default function StickyOrderButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button after scrolling down 300px
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const handleOrderClick = () => {
    window.open(process.env.NEXT_PUBLIC_GOOGLE_FORM_URL, '_blank')
  }

  return (
    <button
      onClick={handleOrderClick}
      className={`fixed bottom-6 right-6 z-40 md:hidden bg-bakery-accent hover:bg-bakery-accent/90 text-white font-heading px-6 py-4 rounded-full shadow-2xl transition-all duration-300 flex items-center space-x-2 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
      aria-label="Order Now"
    >
      <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <span className="text-sm tracking-wide">ORDER NOW</span>
    </button>
  )
}
