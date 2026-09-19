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
    <section className="py-12 border-b border-line">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-heading text-ink text-4xl">{title}</h2>
          <p className="font-body text-muted text-xs">{subtitle}</p>
        </div>

        <div className="flex space-x-6 overflow-x-auto pb-8 no-scrollbar snap-x px-4 md:justify-center">
          {products.map((product, i) => (
            <div
              key={product.id}
              onClick={() => onProductClick(product)}
              className="flex-shrink-0 w-[260px] snap-center group cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="relative aspect-[4/5] overflow-hidden border border-line group-hover:border-ink/30 transition-all duration-700">
                <Image
                  src={product.imageUrl || '/images/placeholder-product.jpg'}
                  alt={product.name}
                  fill
                  sizes="260px"
                  className="object-cover group-hover:scale-110 transition-transform duration-1000"
                />
                <div className="absolute top-3 left-3 bg-paper/90 px-2.5 py-1.5">
                  <ProductBadge type="sims-choice" size="md" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-heading text-white text-2xl leading-tight">{product.name}</h3>
                  <p className="text-white/90 text-xs mt-1 tracking-wider">RM {product.price.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
