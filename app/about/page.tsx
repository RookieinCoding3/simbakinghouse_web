import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import OurCraftSection from '@/components/sections/OurCraftSection'

export const metadata: Metadata = {
  title: 'About Us | Sim Baking House',
  description:
    'Learn about Sim Baking House - our story, passion for artisanal baking, and commitment to quality in the heart of Penang.',
  keywords: 'about sim baking house, penang bakery, artisan bread, handcrafted pastries',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-16 md:pt-20">
      {/* Hero Section with Bread Background */}
      <section className="relative h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden bg-bakery-cream">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bakery-cream"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="font-heading text-bakery-brown text-5xl sm:text-6xl md:text-7xl mb-4">
            ABOUT US
          </h1>
          <p className="font-body text-bakery-brown/70 text-lg sm:text-xl max-w-2xl mx-auto">
            Handcrafted with love and tradition in the heart of Penang
          </p>
        </div>
      </section>

      {/* Our Story Section - Image + Content Side by Side */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Image */}
            <div className="relative h-[400px] md:h-[600px] rounded-lg overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-bakery-brown/10 flex items-center justify-center">
                <div className="text-center">
                  <p className="font-heading text-bakery-brown/30 text-2xl mb-2">
                    Baker Image Placeholder
                  </p>
                  <div className="inline-block border-2 border-bakery-accent/30 px-4 py-2 mt-4">
                    <p className="font-heading text-bakery-accent text-xl tracking-widest">
                      EST. 2017
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <div>
                <p className="font-body text-bakery-accent text-sm sm:text-base tracking-widest uppercase mb-3">
                  Our Story
                </p>
                <h2 className="font-heading text-bakery-brown text-4xl sm:text-5xl mb-6">
                  A SPACE FOR BAKING
                </h2>
              </div>

              <div className="space-y-4 font-body text-bakery-brown/80 text-base sm:text-lg leading-relaxed">
                <p>
                  Welcome to <span className="font-bold text-bakery-brown">Sim Baking House</span>,
                  where tradition meets passion in every bite. Nestled in the heart of Penang,
                  we&apos;ve been crafting artisanal baked goods that bring warmth and joy to our community since 2017.
                </p>
                <p>
                  Our journey began with a simple belief: that baking is more than just following
                  recipes—it&apos;s about pouring love, care, and dedication into every creation.
                  From our signature breads to our delicate pastries, each item is handcrafted
                  using time-honored techniques and the finest ingredients.
                </p>
              </div>

              {/* Opening Hours */}
              <div className="bg-bakery-cream/50 rounded-lg p-6 mt-8">
                <h3 className="font-heading text-bakery-brown text-xl mb-4 tracking-wide">
                  OPENING HOURS
                </h3>
                <div className="space-y-2 font-body text-bakery-brown/80">
                  <div className="flex justify-between items-center">
                    <span>Daily</span>
                    <span className="font-semibold">6:30 AM — 1:00 PM</span>
                  </div>
                  <p className="text-sm text-bakery-accent/80 italic mt-2">
                    Fresh supplies available daily
                  </p>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex space-x-4 pt-4">
                <a
                  href="https://www.facebook.com/p/Sim-Baking-House-100057442848182/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-bakery-accent flex items-center justify-center text-white hover:bg-bakery-accent/90 transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/sim_baking_house/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-bakery-accent flex items-center justify-center text-white hover:bg-bakery-accent/90 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="https://wa.me/60123456789"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-bakery-accent flex items-center justify-center text-white hover:bg-bakery-accent/90 transition-colors"
                  aria-label="WhatsApp"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Freshly Baked Section - Content + Image */}
      <section className="py-16 md:py-24 bg-bakery-cream">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Content */}
            <div className="space-y-6 order-2 md:order-1">
              <h2 className="font-heading text-bakery-brown text-4xl sm:text-5xl md:text-6xl">
                FRESHLY BAKED BREAD
                <br />
                <span className="text-bakery-accent">EVERY MORNING</span>
              </h2>

              <div className="space-y-4 font-body text-bakery-brown/80 text-base sm:text-lg leading-relaxed">
                <p>
                  Every morning before sunrise, our bakers begin their craft. Using traditional methods
                  passed down through generations, we create bread that&apos;s not just food, but an
                  experience of warmth and comfort.
                </p>
                <p>
                  From the first knead of the dough to the moment it emerges golden and aromatic from
                  our ovens, every step is guided by passion and expertise. We believe in quality over
                  quantity, ensuring each loaf meets our exacting standards.
                </p>
              </div>

              <Link
                href="/products"
                className="inline-block bg-bakery-accent hover:bg-bakery-accent/90 text-white font-heading px-8 py-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                VIEW OUR PRODUCTS
              </Link>
            </div>

            {/* Image */}
            <div className="relative h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-2xl order-1 md:order-2">
              <div className="absolute inset-0 bg-bakery-brown/10 flex items-center justify-center">
                <p className="font-heading text-bakery-brown/30 text-2xl text-center px-4">
                  Fresh Bread Image Placeholder
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Craft Section - Replaces Why Choose Us */}
      <OurCraftSection />

      {/* Minimal Contact Bar - Replaces CTA Section */}
      <section className="py-12 md:py-16 bg-bakery-dark border-t border-bakery-cream/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="font-body text-bakery-cream/70 text-base md:text-lg">
                Questions about our bakes?
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://wa.me/60123456789"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-bakery-accent hover:text-bakery-accent/80 font-body text-sm md:text-base transition-colors underline"
              >
                WhatsApp Us
              </a>
              <span className="hidden sm:inline text-bakery-cream/30">|</span>
              <a
                href="mailto:simbakinghouse25@gmail.com"
                className="inline-block text-bakery-accent hover:text-bakery-accent/80 font-body text-sm md:text-base transition-colors underline"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
