'use client'

import Link from 'next/link'

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover parallax-slow"
        style={{ backgroundColor: '#000' }}
      >
        <source src="/landing_page.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Semi-transparent Black Overlay with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60"></div>

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
        <div className="space-y-6 md:space-y-8">
          {/* Subtitle */}
          <p className="font-body text-bakery-accent text-lg sm:text-xl md:text-2xl tracking-[0.3em] uppercase text-reveal">
            Welcome to
          </p>

          {/* Main Title */}
          <h1 className="font-heading text-bakery-cream text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-tight tracking-wider animate-fade-in-up">
            A SPACE FOR
            <br />
            <span className="text-bakery-accent inline-block">BAKING</span>
          </h1>

          {/* Description */}
          <p className="font-body text-bakery-cream/90 text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed animate-fade-in-delayed">
            Quality baking ingredients and supplies for every baker in Penang
          </p>

          {/* CTA Button */}
          <div className="pt-4 md:pt-8 animate-fade-in-delayed-more">
            <Link
              href="/products"
              className="inline-flex items-center space-x-2 bg-bakery-accent text-bakery-dark px-8 md:px-10 py-4 md:py-5 font-heading text-base md:text-lg tracking-[0.15em] hover:tracking-[0.2em] transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-bakery-accent/30 font-bold rounded-lg"
            >
              <span>EXPLORE OUR PRODUCTS</span>
              <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

      </div>
    </section>
  )
}
