'use client'

import { memo } from 'react'
import Image from 'next/image'
import type { Product } from '@/types/product'
import ProductBadge from './ProductBadge'

interface SimsChoiceSpotlightProps {
  products: Product[]
  onProductClick: (product: Product) => void
  title?: string
  subtitle?: string
}

function SimsChoiceSpotlight({
  products,
  onProductClick,
  title = "Sim's Starter Kit",
  subtitle = "Everything you need to begin your baking journey"
}: SimsChoiceSpotlightProps) {
  if (!products || products.length === 0) return null

  return (
    <section className="bg-gradient-to-b from-bakery-brown to-bakery-dark py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="font-heading text-bakery-accent text-3xl md:text-4xl lg:text-5xl tracking-wider mb-3">
            {title}
          </h2>
          <p className="font-body text-bakery-cream/80 text-base md:text-lg max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Product Grid - Horizontal scroll on mobile, grid on desktop */}
        <div className="overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 pb-4 md:pb-0" style={{ minWidth: 'max-content' }}>
            {products.slice(0, 5).map((product, index) => (
              <div
                key={product.id}
                onClick={() => onProductClick(product)}
                className="group cursor-pointer flex-shrink-0 w-[240px] md:w-auto"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 100}ms backwards`
                }}
              >
                {/* Card Content */}
                <div className="relative aspect-[3/4] overflow-hidden bg-bakery-cream/5 border border-bakery-accent/20 group-hover:border-bakery-accent/60 transition-all duration-500">
                  <Image
                    src={product.imageUrl || '/images/placeholder-product.jpg'}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 240px, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />

                  {/* Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <ProductBadge type="sims-choice" size="md" />
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-bakery-dark/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:flex flex-col items-center justify-center p-6 text-center">
                    <span className="border-2 border-bakery-accent text-bakery-accent px-6 py-3 font-heading tracking-widest text-sm uppercase">
                      VIEW DETAILS
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="mt-3 md:mt-4 text-center md:text-left">
                  <h3 className="font-heading text-bakery-cream text-base md:text-lg lg:text-xl tracking-wide uppercase mb-1 line-clamp-1">
                    {product.name}
                  </h3>
                  {product.mentorNote && (
                    <p className="text-bakery-cream/60 text-xs md:text-sm line-clamp-2 mb-2">
                      {product.mentorNote}
                    </p>
                  )}
                  <p className="font-heading text-bakery-accent text-base md:text-lg">
                    RM {product.price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator (mobile only) */}
        <div className="md:hidden text-center mt-4">
          <p className="text-bakery-cream/40 text-xs uppercase tracking-wider">
            Swipe to see more
          </p>
        </div>
      </div>
    </section>
  )
}

export default memo(SimsChoiceSpotlight)
