'use client'

import { memo } from 'react'
import Image from 'next/image'
import type { Product } from '@/types/product'
import ProductBadge from './ProductBadge'

interface ProductCardProps {
  product: Product
  onClick: () => void
  animationDelay?: number
}

function ProductCard({ product, onClick, animationDelay }: ProductCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer flex flex-col space-y-2 md:space-y-3"
      style={{
        animation: animationDelay !== undefined
          ? `fadeInUp 0.6s ease-out ${animationDelay}ms backwards`
          : undefined
      }}
    >
      {/* Visual Container - Aesthetic with thin borders */}
      <div className="relative aspect-square overflow-hidden rounded-sm border border-bakery-cream/10 group-hover:border-bakery-accent/30 transition-all duration-700">
        <Image
          src={product.imageUrl || '/images/placeholder-product.jpg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          className={`object-cover transition-transform duration-1000 ease-out group-hover:scale-110 ${
            !product.inStock ? 'grayscale opacity-40' : ''
          }`}
          priority
          onError={(e) => {
            e.currentTarget.src = '/images/placeholder-product.jpg'
          }}
        />

        {/* Featured badge - top left */}
        {product.featured && (
          <div className="absolute top-2 left-2 z-10">
            <ProductBadge type="sims-choice" size="sm" />
          </div>
        )}

        {/* Other badges - top right (max 2) */}
        {product.badges && product.badges.length > 0 && (
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
            {product.badges.slice(0, 2).map(badge => (
              <ProductBadge key={badge} type={badge} size="sm" />
            ))}
          </div>
        )}

        {/* Out of Stock - Mobile */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-bakery-dark/50 backdrop-blur-sm flex items-center justify-center md:hidden">
            <span className="bg-bakery-dark/80 backdrop-blur-md text-bakery-cream px-3 py-1 text-[10px] uppercase tracking-widest border border-bakery-cream/10 rounded-full">
              Sold Out
            </span>
          </div>
        )}

        {/* Glass-morphism Hover Overlay (Desktop only) */}
        <div className="absolute inset-0 bg-bakery-dark/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:flex flex-col items-center justify-center p-6">
          <span className="border border-bakery-accent/60 text-bakery-accent px-4 py-2 font-heading tracking-widest text-xs uppercase backdrop-blur-md bg-bakery-dark/20 rounded-sm">
            {!product.inStock ? 'Sold Out' : 'View Details'}
          </span>
          {product.mentorNote && product.inStock && (
            <p className="text-bakery-cream/70 text-xs text-center mt-3 line-clamp-2 max-w-[90%] italic">
              {product.mentorNote.length > 60 ? `${product.mentorNote.slice(0, 60)}...` : product.mentorNote}
            </p>
          )}
        </div>
      </div>

      {/* Info: Clean Typography */}
      <div className="text-center md:text-left transition-transform duration-500 group-hover:-translate-y-1">
        <h3 className="font-heading text-bakery-cream text-sm md:text-lg lg:text-xl tracking-wide uppercase line-clamp-1">
          {product.name}
        </h3>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-1">
          <p className="text-bakery-cream/40 text-[10px] uppercase tracking-wide hidden md:block">
            {product.category}
          </p>
          <p className="font-heading text-bakery-accent text-base md:text-lg">
            RM {product.price.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default memo(ProductCard)
