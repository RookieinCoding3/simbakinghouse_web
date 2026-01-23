'use client'

import Image from 'next/image'
import type { Product } from '@/types/product'

interface ProductCardProps {
  product: Product
  onClick: () => void
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-bakery-cream/5 rounded-sm overflow-hidden cursor-pointer border border-bakery-cream/10 hover:border-bakery-accent/50 transition-all duration-500"
    >
      {/* Image Container - Square aspect ratio */}
      <div className="relative aspect-square">
        <Image
          src={product.imageUrl || '/images/placeholder-product.jpg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition-transform duration-700 group-hover:scale-105 ${
            !product.inStock ? 'grayscale' : ''
          }`}
          priority
          onError={(e) => {
            e.currentTarget.src = '/images/placeholder-product.jpg'
          }}
        />

        {/* Out of Stock - Minimal Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-bakery-dark/60 flex items-center justify-center">
            <span className="bg-bakery-dark text-bakery-cream px-3 py-1 text-[10px] uppercase tracking-widest border border-bakery-cream/20">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Info: Compact for Mobile, Detailed on Desktop */}
      <div className="p-2 md:p-4">
        <div className="flex flex-col space-y-1">
          <h3 className="font-heading text-bakery-cream text-sm md:text-lg tracking-wide line-clamp-1 group-hover:text-bakery-accent transition-colors">
            {product.name}
          </h3>
          <div className="flex justify-between items-end">
            <p className="text-bakery-accent/60 text-[10px] md:text-xs uppercase tracking-wide">
              {product.category}
            </p>
            <p className="font-heading text-bakery-accent text-base md:text-xl">
              RM{product.price.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Desktop-only description - Hidden on mobile */}
        <p className="hidden md:block font-body text-bakery-cream/50 text-sm mt-3 line-clamp-2">
          {product.description}
        </p>
      </div>
    </div>
  )
}
