'use client'

import Image from 'next/image'
import ProductBadge from './ProductBadge'
import type { Product } from '@/types/product'

interface SimsChoiceSpotlightProps {
  products: Product[]
  onProductClick: (product: Product) => void
  title?: string
  subtitle?: string
}

export default function SimsChoiceSpotlight({
  products,
  onProductClick,
  title = "SIM'S STARTER KIT",
  subtitle = "Personally curated essentials for your baking road"
}: SimsChoiceSpotlightProps) {
  if (!products || products.length === 0) return null

  return (
    <section className="py-12 bg-gradient-to-b from-bakery-dark to-transparent">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-heading text-bakery-accent text-4xl tracking-tighter">{title.toUpperCase()}</h2>
          <p className="font-body text-bakery-cream/50 italic text-sm">{subtitle}</p>
        </div>

        <div className="flex space-x-6 overflow-x-auto pb-8 no-scrollbar snap-x px-4 md:justify-center">
          {products.map((product, i) => (
            <div
              key={product.id}
              onClick={() => onProductClick(product)}
              className="flex-shrink-0 w-[260px] snap-center group cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-bakery-cream/10 group-hover:border-bakery-accent/40 transition-all duration-700">
                <Image
                  src={product.imageUrl || '/images/placeholder-product.jpg'}
                  alt={product.name}
                  fill
                  sizes="260px"
                  className="object-cover group-hover:scale-110 transition-transform duration-1000"
                />
                <div className="absolute top-3 left-3">
                  <ProductBadge type="sims-choice" size="md" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-bakery-dark/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-heading text-bakery-cream text-xl uppercase leading-tight">{product.name}</h3>
                  <p className="text-bakery-accent text-sm mt-1 font-heading">RM {product.price.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
