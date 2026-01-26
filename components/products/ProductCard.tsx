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
  /** Use responsive light/dark theme (light on mobile, dark on desktop) */
  responsiveTheme?: boolean
}

function ProductCard({ product, onClick, animationDelay, responsiveTheme = false }: ProductCardProps) {
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
      {/* The Visual Frame - Responsive: white border on mobile, glow on desktop */}
      <div className={cn(
        "relative aspect-square overflow-hidden transition-all duration-500 rounded-sm",
        responsiveTheme
          ? "bg-white shadow-sm border border-bakery-brown/5 md:bg-transparent md:shadow-none md:border-0 group-hover:shadow-md md:group-hover:shadow-[0_0_40px_rgba(212,165,116,0.1)]"
          : "group-hover:shadow-[0_0_40px_rgba(212,165,116,0.1)]"
      )}>
        <Image
          src={product.imageUrl || '/images/placeholder-product.jpg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          className={cn(
            "object-cover transition-transform duration-700 ease-out group-hover:scale-105",
            !product.inStock && "grayscale opacity-30"
          )}
          onError={(e) => {
            e.currentTarget.src = '/images/placeholder-product.jpg'
          }}
        />

        {/* Subtle Stamp Badge - Only show featured on mobile for cleanliness */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.featured && <ProductBadge type="sims-choice" size="sm" />}
          {/* Hide secondary badges on mobile for cleaner look */}
          <span className="hidden md:block">
            {product.badges?.[0] && <ProductBadge type={product.badges[0]} size="sm" />}
          </span>
        </div>

        {/* Out of Stock Overlay - Responsive */}
        {!product.inStock && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center",
            responsiveTheme
              ? "bg-white/60 md:bg-bakery-dark/40 md:backdrop-blur-sm"
              : "bg-bakery-dark/40 backdrop-blur-sm"
          )}>
            <span className={cn(
              "text-[10px] uppercase tracking-[0.2em] font-heading",
              responsiveTheme
                ? "text-bakery-brown/60 md:text-bakery-cream/80"
                : "text-bakery-cream/80"
            )}>
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Minimalist Info - Responsive: dark text on mobile, light on desktop */}
      <div className="text-left px-1">
        <h3 className={cn(
          "font-heading text-sm md:text-lg uppercase tracking-tight truncate transition-colors duration-300",
          responsiveTheme
            ? "text-bakery-brown md:text-bakery-cream group-hover:text-bakery-accent"
            : "text-bakery-cream group-hover:text-bakery-accent"
        )}>
          {product.name}
        </h3>
        <p className={cn(
          "font-body text-xs md:text-base",
          responsiveTheme
            ? "text-bakery-accent md:text-bakery-accent/70"
            : "text-bakery-accent/70"
        )}>
          RM {product.price.toFixed(2)}
        </p>
      </div>
    </div>
  )
}

export default memo(ProductCard)
