'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function CategoryNavigationSection() {
  const categories = [
    {
      title: "Artisan Breads",
      description: "Handcrafted daily with traditional methods",
      icon: "🍞",
      href: "/products?category=Breads",
      gradient: "from-amber-500/20 to-orange-500/20",
      hoverGradient: "group-hover:from-amber-500/30 group-hover:to-orange-500/30"
    },
    {
      title: "Handcrafted Pastries",
      description: "Delicate, flaky, and perfectly golden",
      icon: "🥐",
      href: "/products?category=Pastries",
      gradient: "from-yellow-500/20 to-amber-500/20",
      hoverGradient: "group-hover:from-yellow-500/30 group-hover:to-amber-500/30"
    },
    {
      title: "Custom Cakes",
      description: "Made to order for your special occasions",
      icon: "🎂",
      href: "/products?category=Cakes",
      gradient: "from-pink-500/20 to-rose-500/20",
      hoverGradient: "group-hover:from-pink-500/30 group-hover:to-rose-500/30"
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
            Find exactly what you're looking for
          </p>
        </div>

        {/* Category Tiles */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={category.href}
              className="group relative bg-gradient-to-br from-bakery-cream/10 to-bakery-accent/10 rounded-2xl p-8 md:p-10 overflow-hidden hover:shadow-2xl transition-all duration-500 hover-scale animate-fade-in-up border border-bakery-cream/20"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Background Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} ${category.hoverGradient} transition-all duration-500`}></div>

              {/* Content */}
              <div className="relative z-10 text-center">
                {/* Icon */}
                <div className="text-7xl md:text-8xl mb-6 transform group-hover:scale-110 transition-transform duration-500">
                  {category.icon}
                </div>

                {/* Title */}
                <h3 className="font-heading text-bakery-cream text-2xl md:text-3xl mb-3 tracking-wide">
                  {category.title.toUpperCase()}
                </h3>

                {/* Description */}
                <p className="font-body text-bakery-cream/80 text-sm md:text-base mb-6">
                  {category.description}
                </p>

                {/* Arrow CTA */}
                <div className="flex items-center justify-center space-x-2 text-bakery-accent group-hover:text-bakery-cream transition-colors duration-300">
                  <span className="font-body text-sm tracking-widest uppercase">
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
