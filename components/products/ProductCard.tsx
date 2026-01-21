'use client'

import Image from 'next/image'
import type { Product } from '@/types/product'
import { cn } from '@/lib/utils/cn'

interface ProductCardProps {
  product: Product
  onClick: () => void
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-bakery-cream rounded-lg overflow-hidden',
        'shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer',
        'hover-scale shimmer paper-texture animate-fade-in-up'
      )}
    >
      {/* Product Image */}
      <div className="relative w-full h-64 bg-bakery-accent/10 overflow-hidden">
        <Image
          src={product.imageUrl || '/images/placeholder-product.jpg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          priority
          onError={(e) => {
            e.currentTarget.src = '/images/placeholder-product.jpg'
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-bakery-brown/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Category Badge */}
        <div className="absolute top-4 right-4 bg-bakery-accent text-bakery-brown font-heading text-xs px-3 py-1 rounded-full shadow-lg">
          {product.category}
        </div>

        {/* Stock Status Badge */}
        {!product.inStock && (
          <div className="absolute top-4 left-4 bg-bakery-brown/90 text-bakery-cream font-body text-xs px-3 py-1 rounded-full shadow-lg">
            Out of Stock
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-6 space-y-3">
        <h3 className="font-heading text-bakery-brown text-2xl tracking-wide line-clamp-1 group-hover:text-bakery-accent transition-colors duration-300">
          {product.name}
        </h3>

        <p className="font-body text-bakery-brown/70 text-base leading-relaxed line-clamp-3 min-h-[4.5rem]">
          {product.description}
        </p>

        {/* View Details CTA */}
        <div className="pt-2 flex items-center justify-end">
          <span className="font-body text-bakery-accent text-sm tracking-widest uppercase group-hover:tracking-[0.2em] transition-all duration-300 flex items-center space-x-2">
            <span>View Details</span>
            <svg
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  )
}
