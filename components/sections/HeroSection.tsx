'use client'

import Button from '@/components/ui/Button'

export default function HeroSection() {
  const scrollToProducts = () => {
    const element = document.getElementById('products')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

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
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ backgroundColor: '#000' }}
      >
        <source src="/landing_page.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Semi-transparent Black Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
        <div className="space-y-6 md:space-y-8">
          {/* Subtitle */}
          <p className="font-body text-bakery-accent text-lg sm:text-xl md:text-2xl tracking-widest uppercase animate-fade-in">
            Welcome to
          </p>

          {/* Main Title */}
          <h1 className="font-heading text-bakery-cream text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-tight animate-fade-in-up">
            A SPACE FOR
            <br />
            <span className="text-bakery-accent">BAKING</span>
          </h1>

          {/* Description */}
          <p className="font-body text-bakery-cream/90 text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed animate-fade-in-up-delayed">
            Handcrafted pastries, breads, and cakes made with love and tradition
            in the heart of Penang
          </p>

          {/* CTA Button */}
          <div className="pt-4 md:pt-8 animate-fade-in-up-delayed-more">
            <Button
              variant="primary"
              size="lg"
              onClick={scrollToProducts}
              className="text-xl"
            >
              EXPLORE OUR PRODUCTS
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-bakery-cream/50"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </div>
    </section>
  )
}
