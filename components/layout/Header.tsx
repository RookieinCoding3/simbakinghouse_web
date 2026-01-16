'use client'

export default function Header() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bakery-brown/95 backdrop-blur-sm border-b border-bakery-cream/20">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <button
            onClick={() => scrollToSection('hero')}
            className="font-heading text-2xl md:text-3xl text-bakery-cream hover:text-bakery-accent transition-colors duration-200"
          >
            SIM BAKING HOUSE
          </button>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('products')}
              className="font-body text-bakery-cream hover:text-bakery-accent transition-colors duration-200"
            >
              Products
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="font-body text-bakery-cream hover:text-bakery-accent transition-colors duration-200"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('location')}
              className="font-body text-bakery-cream hover:text-bakery-accent transition-colors duration-200"
            >
              Location
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-bakery-cream"
            onClick={() => scrollToSection('products')}
            aria-label="Menu"
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
              <path d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
      </nav>
    </header>
  )
}
