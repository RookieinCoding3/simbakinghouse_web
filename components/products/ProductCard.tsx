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
        'group relative bg-bakery-cream rounded-lg overflow-hidden shadow-md',
        'hover:shadow-2xl transition-all duration-300 cursor-pointer',
        'transform hover:-translate-y-2'
      )}
    >
      {/* Product Image */}
      <div className="relative w-full h-64 bg-bakery-accent/10 overflow-hidden">
        <Image
          src={product.imageUrl || '/images/placeholder-product.jpg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-bakery-brown/0 group-hover:bg-bakery-brown/20 transition-colors duration-300" />
      </div>

      {/* Product Info */}
      <div className="p-4 sm:p-6">
        <h3 className="font-heading text-bakery-brown text-xl sm:text-2xl mb-2 line-clamp-1">
          {product.name}
        </h3>

        <p className="font-body text-bakery-brown/70 text-sm sm:text-base line-clamp-2 mb-4">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="font-heading text-bakery-accent text-2xl">
            RM {product.price.toFixed(2)}
          </span>

          <span className="font-body text-bakery-brown/60 text-sm group-hover:text-bakery-accent transition-colors duration-200">
            View Details →
          </span>
        </div>
      </div>

      {/* Badge (Optional - for featured products) */}
      {/* Uncomment if you want to add badges
      <div className="absolute top-4 right-4 bg-bakery-accent text-bakery-brown font-heading text-xs px-3 py-1 rounded-full shadow-lg">
        NEW
      </div>
      */}
    </div>
  )
}
