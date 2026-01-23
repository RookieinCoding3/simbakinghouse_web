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
      className="group relative bg-bakery-cream/5 border border-bakery-cream/10 overflow-hidden cursor-pointer hover:border-bakery-accent/50 transition-all duration-500"
    >
      {/* Image Container */}
      <div className="aspect-square overflow-hidden relative">
        <Image
          src={product.imageUrl || '/images/placeholder-product.jpg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover transition-transform duration-700 group-hover:scale-110 ${
            !product.inStock ? 'grayscale opacity-50' : ''
          }`}
          priority
          onError={(e) => {
            e.currentTarget.src = '/images/placeholder-product.jpg'
          }}
        />

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-bakery-dark/60">
            <p className="font-heading text-bakery-cream text-lg tracking-widest uppercase">
              Out of Stock
            </p>
          </div>
        )}

        {/* Hover Overlay with Description */}
        <div className="absolute inset-0 bg-bakery-dark/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6 text-center">
          <p className="font-body text-bakery-cream/90 text-sm leading-relaxed italic">
            {product.description}
          </p>
        </div>
      </div>

      {/* Basic Info - Always Visible */}
      <div className="p-4 flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-heading text-bakery-cream text-lg tracking-wide uppercase mb-1">
            {product.name}
          </h3>
          <p className="text-bakery-accent/60 text-xs uppercase tracking-widest">
            {product.category}
          </p>
        </div>
        <p className="font-heading text-bakery-accent text-xl ml-4">
          RM{product.price.toFixed(2)}
        </p>
      </div>
    </div>
  )
}
