'use client'

import Link from 'next/link'

export default function BakersJourneySection() {
  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-block bg-bakery-accent/10 rounded-full px-6 py-2 mb-6">
            <span className="font-heading text-bakery-accent text-sm tracking-widest">
              EST. 2017
            </span>
          </div>

          {/* Story Snippet */}
          <h2 className="font-heading text-bakery-brown text-3xl sm:text-4xl md:text-5xl mb-6">
            THE BAKER&apos;S JOURNEY
          </h2>

          <p className="font-body text-bakery-brown/80 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mb-8">
            Crafting joy since 2017 in the heart of Penang. Our journey began with a simple belief:
            that baking is more than just following recipes—it&apos;s about pouring love, care, and dedication
            into every creation. From sunrise dough to golden-brown perfection, we honor tradition while
            creating memories one bite at a time.
          </p>

          {/* CTA */}
          <Link
            href="/about"
            className="inline-flex items-center space-x-2 text-bakery-accent hover:text-bakery-accent/80 font-body text-base tracking-wide transition-colors duration-200 group"
          >
            <span>Read Our Full Story</span>
            <svg
              className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
