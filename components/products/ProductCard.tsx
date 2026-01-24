'use client'

import { memo } from 'react'
import Image from 'next/image'
import type { Product } from '@/types/product'

interface ProductCardProps {
  product: Product
  onClick: () => void
}

function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer flex flex-col space-y-2 md:space-y-3"
    >
      {/* Visual Container: Minimalist & Tactile */}
      <div className="relative aspect-square overflow-hidden bg-bakery-cream/5 md:bg-transparent">
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

        {/* Out of Stock - Mobile */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-bakery-dark/60 flex items-center justify-center md:hidden">
            <span className="bg-bakery-dark text-bakery-cream px-3 py-1 text-[10px] uppercase tracking-widest border border-bakery-cream/20">
              Sold Out
            </span>
          </div>
        )}

        {/* Elegant Hover Overlay (Desktop only) */}
        <div className="absolute inset-0 bg-bakery-dark/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:flex items-center justify-center p-6">
          <span className="border border-bakery-accent text-bakery-accent px-4 py-2 font-heading tracking-widest text-xs uppercase">
            {!product.inStock ? 'Sold Out' : 'Discover'}
          </span>
        </div>
      </div>

      {/* Info: Clean Typography */}
      <div className="text-center md:text-left transition-transform duration-500 group-hover:-translate-y-1">
        <h3 className="font-heading text-bakery-cream text-sm md:text-lg lg:text-xl tracking-wide uppercase line-clamp-1">
          {product.name}
        </h3>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-1">
          <p className="text-bakery-accent/50 text-[10px] uppercase tracking-wide hidden md:block">
            {product.category}
          </p>
          <p className="font-body text-bakery-accent text-base md:text-lg">
            RM {product.price.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default memo(ProductCard)
