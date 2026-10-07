'use client'

import { memo } from 'react'
import Image from 'next/image'
import type { Product } from '@/types/product'
import { cn } from '@/lib/utils/cn'
import { productAvailability, onlineUnits, STOCK_LABEL } from '@/lib/productView'
import { formatSen } from '@/lib/money'

interface ProductCardProps {
  product: Product
  onClick: () => void
  index?: number
  /** Use responsive light/dark theme (light on mobile, dark on desktop) */
  responsiveTheme?: boolean
}

function cardPrice(product: Product): string {
  const units = onlineUnits(product)
  if (units.length === 0) return 'Wholesale'
  const priced = units.filter((u) => u.priceSen !== null).map((u) => u.priceSen as number)
  if (priced.length === 0) return 'Ask for price'
  const min = Math.min(...priced)
  return units.length > 1 && new Set(priced).size > 1 ? `from ${formatSen(min)}` : formatSen(min)
}

function ProductCard({ product, onClick, index = 0, responsiveTheme = false }: ProductCardProps) {
  const { sellable, status } = productAvailability(product)
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer flex flex-col space-y-3 animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* The Visual Frame - Premium aspect ratio 4:5 */}
      <div className={cn(
        "relative aspect-[4/5] overflow-hidden transition-all duration-700 bg-white border border-line"
      )}>
        <Image
          src={product.imageUrl || '/images/placeholder-product.jpg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          className={cn(
            "object-cover transition-transform duration-1000 ease-out group-hover:scale-110",
            !sellable && "grayscale opacity-30"
          )}
          onError={(e) => {
            e.currentTarget.src = '/images/placeholder-product.jpg'
          }}
        />

        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.featured && (
            <span className="bg-clay text-paper text-[10px] font-body font-medium uppercase px-3 py-1.5 tracking-widest">
              SIM&apos;S PICK
            </span>
          )}
        </div>

        {/* Out of Stock Overlay — boolean only, never a count (owner may not
            track exact stock, and a count invites arguing over the number) */}
        {!sellable && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center",
            "bg-paper/60 backdrop-blur-sm"
          )}>
            <span className={cn(
              "text-[11px] uppercase tracking-[0.2em] font-body font-medium px-4 py-2",
              "text-ink/80 bg-paper/80"
            )}>
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info - Clean Layout */}
      <div className="flex justify-between items-start px-1">
        <div className="max-w-[70%]">
          <h3 className={cn(
            "font-heading text-lg md:text-xl leading-tight line-clamp-1 transition-colors duration-300",
            "text-ink group-hover:text-clay"
          )}>
            {product.name}
          </h3>
          <p className={cn(
            "text-[10px] uppercase tracking-widest mt-1",
            "text-ink/50"
          )}>
            {product.category}
          </p>
          {status && status !== 'out' && (
            <p className={cn('text-[10px] uppercase tracking-widest mt-1 font-medium', status === 'low' ? 'text-clay' : 'text-ink/50')}>
              {STOCK_LABEL[status]}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className={cn(
            "font-heading text-lg md:text-xl",
            "text-clay"
          )}>
            {cardPrice(product)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default memo(ProductCard)
