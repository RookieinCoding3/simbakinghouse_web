'use client'

import { cn } from '@/lib/utils/cn'
import ProductBadge from './ProductBadge'

interface MobileFilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  categories: string[]
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
  totalProducts: number
}

export default function MobileFilterDrawer({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onSelectCategory,
  totalProducts
}: MobileFilterDrawerProps) {
  return (
    <div className={cn(
      "fixed inset-0 z-[100] transition-all duration-700",
      isOpen ? "visible" : "invisible"
    )}>
      {/* Backdrop with blur */}
      <div
        className={cn(
          "absolute inset-0 bg-bakery-dark/60 backdrop-blur-xl transition-opacity duration-500",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Boutique Drawer - Slides from right */}
      <div className={cn(
        "absolute right-0 top-0 bottom-0 w-[85%] max-w-md bg-bakery-dark paper-texture p-8 md:p-10 flex flex-col transition-transform duration-500 ease-out shadow-2xl",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <h2 className="font-heading text-bakery-accent text-2xl md:text-3xl tracking-widest uppercase">
            Filter
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-bakery-cream/50 hover:text-bakery-accent transition-colors"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Category List */}
        <div className="flex-1 space-y-12 overflow-y-auto">
          <div className="space-y-6">
            <p className="font-body text-bakery-cream/30 text-[10px] tracking-[0.3em] uppercase">
              Collections
            </p>
            <div className="flex flex-col space-y-4">
              {/* All Products Option */}
              <button
                onClick={() => { onSelectCategory(null); onClose(); }}
                className={cn(
                  "font-heading text-3xl md:text-4xl text-left transition-all duration-300 hover:translate-x-2",
                  !selectedCategory
                    ? "text-bakery-accent"
                    : "text-bakery-cream/60 hover:text-bakery-cream"
                )}
              >
                All Bakes
              </button>

              {/* Category Options */}
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { onSelectCategory(cat); onClose(); }}
                  className={cn(
                    "font-heading text-3xl md:text-4xl text-left transition-all duration-300 hover:translate-x-2",
                    selectedCategory === cat
                      ? "text-bakery-accent"
                      : "text-bakery-cream/60 hover:text-bakery-cream"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Guided Paths - Quick Shortcuts */}
          <div className="pt-8 border-t border-bakery-cream/10 space-y-6">
            <p className="font-body text-bakery-cream/30 text-[10px] tracking-[0.3em] uppercase">
              Guided Paths
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                <ProductBadge type="beginner-friendly" size="md" />
              </div>
              <div className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                <ProductBadge type="sims-secret" size="md" />
              </div>
              <div className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                <ProductBadge type="sourdough-essential" size="md" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 mt-8 border-t border-bakery-cream/10">
          <p className="font-body text-bakery-cream/30 text-[10px] tracking-widest uppercase text-center mb-6">
            {totalProducts} Curated Essentials
          </p>
          <button
            onClick={onClose}
            className="w-full bg-bakery-accent text-bakery-dark py-4 font-heading text-lg tracking-[0.2em] rounded-sm hover:bg-bakery-cream transition-colors"
          >
            VIEW COLLECTION
          </button>
        </div>
      </div>
    </div>
  )
}
