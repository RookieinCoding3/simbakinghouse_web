'use client'

import { memo } from 'react'
import Image from 'next/image'
import type { Product } from '@/types/product'
import { cn } from '@/lib/utils/cn'
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
      className="group cursor-pointer flex flex-col space-y-4"
      style={{
        animation: animationDelay !== undefined
          ? `fadeInUp 0.6s ease-out ${animationDelay}ms backwards`
          : undefined
      }}
    >
      {/* Visual aspect - No background, just a soft glow on hover */}
      <div className="relative aspect-square overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.3)] transition-all duration-700 group-hover:shadow-[0_0_50px_rgba(212,165,116,0.15)]">
        <Image
          src={product.imageUrl || '/images/placeholder-product.jpg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          className={cn(
            "object-cover transition-transform duration-1000 ease-out group-hover:scale-110",
            !product.inStock && "grayscale opacity-40"
          )}
          priority
          onError={(e) => {
            e.currentTarget.src = '/images/placeholder-product.jpg'
          }}
        />

        {/* Floating Badges - Absolute positioning makes them feel "stamped" on */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 scale-90 group-hover:scale-100 transition-transform duration-500 origin-top-left">
          {product.featured && <ProductBadge type="sims-choice" />}
          {product.badges?.[0] && <ProductBadge type={product.badges[0]} />}
        </div>

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-bakery-dark/40 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-bakery-dark/80 backdrop-blur-md text-bakery-cream px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] border border-bakery-cream/10 rounded-sm font-heading">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Info: Centered and Minimalist */}
      <div className="text-center px-2 space-y-1">
        <h3 className="font-heading text-bakery-cream text-lg tracking-[0.1em] uppercase line-clamp-1 group-hover:text-bakery-accent transition-colors duration-500">
          {product.name}
        </h3>
        <p className="font-body text-bakery-accent/80 text-lg">RM {product.price.toFixed(2)}</p>
      </div>
    </div>
  )
}

export default memo(ProductCard)
