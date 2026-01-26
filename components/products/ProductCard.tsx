'use client'

import { memo } from 'react'
import Image from 'next/image'
import type { Product } from '@/types/product'
import { cn } from '@/lib/utils/cn'

interface ProductCardProps {
  product: Product
  onClick: () => void
  index?: number
  /** Use responsive light/dark theme (light on mobile, dark on desktop) */
  responsiveTheme?: boolean
}

function ProductCard({ product, onClick, index = 0, responsiveTheme = false }: ProductCardProps) {
  // Psychological trigger: Show scarcity for low stock items
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5 && product.inStock

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer flex flex-col space-y-3 animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* The Visual Frame - Premium aspect ratio 4:5 */}
      <div className={cn(
        "relative aspect-[4/5] overflow-hidden transition-all duration-700",
        responsiveTheme
          ? "bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] md:bg-transparent md:shadow-none rounded-2xl md:rounded-sm group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] md:group-hover:shadow-[0_0_40px_rgba(212,165,116,0.15)]"
          : "rounded-sm group-hover:shadow-[0_0_40px_rgba(212,165,116,0.15)]"
      )}>
        <Image
          src={product.imageUrl || '/images/placeholder-product.jpg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          className={cn(
            "object-cover transition-transform duration-1000 ease-out group-hover:scale-110",
            !product.inStock && "grayscale opacity-30"
          )}
          onError={(e) => {
            e.currentTarget.src = '/images/placeholder-product.jpg'
          }}
        />

        {/* PSYCHOLOGY: Authority & Scarcity Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {/* Sim's Pick - Authority Bias */}
          {product.featured && (
            <span className="bg-bakery-accent text-bakery-brown text-[10px] font-heading px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md tracking-wide">
              SIM&apos;S PICK
            </span>
          )}
        </div>

        {/* Scarcity Badge - FOMO Trigger (top right) */}
        {isLowStock && (
          <div className="absolute top-3 right-3">
            <span className="bg-red-500/90 text-white text-[9px] font-heading px-2.5 py-1 rounded-full backdrop-blur-md tracking-wider animate-pulse">
              {product.stockQuantity} LEFT
            </span>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center",
            responsiveTheme
              ? "bg-white/70 md:bg-bakery-dark/50 md:backdrop-blur-sm"
              : "bg-bakery-dark/50 backdrop-blur-sm"
          )}>
            <span className={cn(
              "text-xs uppercase tracking-[0.2em] font-heading px-4 py-2 rounded-full",
              responsiveTheme
                ? "text-bakery-brown/70 bg-white/80 md:text-bakery-cream/90 md:bg-bakery-dark/50"
                : "text-bakery-cream/90 bg-bakery-dark/50"
            )}>
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Product Info - Clean Layout */}
      <div className="flex justify-between items-start px-1">
        <div className="max-w-[70%]">
          <h3 className={cn(
            "font-heading text-base md:text-xl uppercase tracking-tight leading-tight line-clamp-1 transition-colors duration-300",
            responsiveTheme
              ? "text-bakery-brown md:text-bakery-cream group-hover:text-bakery-accent"
              : "text-bakery-cream group-hover:text-bakery-accent"
          )}>
            {product.name}
          </h3>
          <p className={cn(
            "text-[10px] uppercase tracking-widest mt-1",
            responsiveTheme
              ? "text-bakery-brown/40 md:text-bakery-cream/40"
              : "text-bakery-cream/40"
          )}>
            {product.category}
          </p>
        </div>
        <div className="text-right">
          <p className={cn(
            "font-heading text-lg md:text-xl",
            responsiveTheme
              ? "text-bakery-accent"
              : "text-bakery-accent"
          )}>
            RM{product.price.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default memo(ProductCard)
