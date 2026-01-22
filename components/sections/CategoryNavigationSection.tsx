'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function CategoryNavigationSection() {
  const categories = [
    {
      title: "Baking Ingredients",
      description: "Premium flour, premixes, and essentials",
      image: "/category-left.png",
      href: "/products?category=Ingredients",
    },
    {
      title: "Baking Tools",
      description: "Professional utensils and equipment",
      image: "/category-middle.png",
      href: "/products?category=Tools",
    },
    {
      title: "Decorations & More",
      description: "Sprinkles, molds, and specialty items",
      image: "/category-right.png",
      href: "/products?category=Decorations",
    }
  ]

  return (
    <section className="py-16 md:py-24 bg-bakery-dark">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <p className="font-body text-bakery-accent text-sm sm:text-base tracking-widest uppercase mb-3">
            Browse by Category
          </p>
          <h2 className="font-heading text-bakery-cream text-4xl sm:text-5xl md:text-6xl mb-4">
            WHAT ARE YOU CRAVING?
          </h2>
          <p className="font-body text-bakery-cream/80 text-lg max-w-2xl mx-auto">
            Find exactly what you&apos;re looking for
          </p>
        </div>

        {/* Category Tiles */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={category.href}
              className="group relative overflow-hidden rounded-2xl hover:shadow-2xl transition-all duration-500 hover-scale animate-fade-in-up"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Background Image */}
              <div className="relative aspect-[2/3]">
                <Image
                  src={category.image}
                  alt={category.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-bakery-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-center">
                {/* Title */}
                <h3 className="font-heading text-bakery-cream text-2xl md:text-3xl mb-2 tracking-wide drop-shadow-lg">
                  {category.title.toUpperCase()}
                </h3>

                {/* Description */}
                <p className="font-body text-bakery-cream/90 text-sm md:text-base mb-4 drop-shadow-md">
                  {category.description}
                </p>

                {/* Arrow CTA */}
                <div className="flex items-center justify-center space-x-2 text-bakery-accent group-hover:text-bakery-cream transition-colors duration-300">
                  <span className="font-body text-sm tracking-widest uppercase font-semibold">
                    Explore
                  </span>
                  <svg
                    className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>

              {/* Shimmer Effect */}
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
