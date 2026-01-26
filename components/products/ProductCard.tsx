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
      className="group cursor-pointer flex flex-col space-y-2 md:space-y-4"
      style={{
        animation: animationDelay !== undefined
          ? `fadeInUp 0.6s ease-out ${animationDelay}ms backwards`
          : undefined
      }}
    >
      {/* Visual aspect - No background, just a soft glow on hover */}
      <div className="relative aspect-square overflow-hidden rounded-sm transition-all duration-700 group-hover:shadow-[0_0_40px_rgba(212,165,116,0.1)]">
        <Image
          src={product.imageUrl || '/images/placeholder-product.jpg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          className={cn(
            "object-cover transition-transform duration-1000 ease-out group-hover:scale-105",
            !product.inStock && "grayscale opacity-30"
          )}
          priority
          onError={(e) => {
            e.currentTarget.src = '/images/placeholder-product.jpg'
          }}
        />

        {/* Minimal Floating Badges - Absolute positioning */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 md:top-3 md:left-3">
          {product.featured && <ProductBadge type="sims-choice" />}
          {product.badges?.[0] && <ProductBadge type={product.badges[0]} />}
        </div>

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-bakery-dark/40 backdrop-blur-sm flex items-center justify-center">
            <span className="text-bakery-cream/80 text-[10px] uppercase tracking-[0.2em] font-heading">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Info: Minimalist & Spaced for Mobile */}
      <div className="px-1 text-left md:text-center">
        <h3 className="font-heading text-bakery-cream text-sm md:text-lg tracking-[0.05em] uppercase line-clamp-1 group-hover:text-bakery-accent transition-colors duration-500">
          {product.name}
        </h3>
        <p className="font-body text-bakery-accent/70 text-xs md:text-base">RM {product.price.toFixed(2)}</p>
      </div>
    </div>
  )
}

export default memo(ProductCard)
