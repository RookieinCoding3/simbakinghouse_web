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
    <>
      {/* Aesthetic Backdrop Blur */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-bakery-dark/40 backdrop-blur-md transition-opacity duration-500",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Slide-up Drawer */}
      <div className={cn(
        "fixed inset-x-0 bottom-0 z-[70] bg-bakery-dark paper-texture border-t border-bakery-cream/10 rounded-t-[2rem] p-8 pb-12 transition-transform duration-500 ease-out",
        isOpen ? "translate-y-0" : "translate-y-full"
      )}>
        {/* Minimalist Close Bar */}
        <div className="flex justify-between items-center mb-10">
          <h2 className="font-heading text-bakery-accent text-2xl tracking-widest uppercase">
            Filter Bakes
          </h2>
          <button onClick={onClose} className="text-bakery-cream/50 hover:text-bakery-accent transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-10">
          {/* Categories Grid */}
          <div className="space-y-4">
            <p className="font-body text-bakery-cream/40 text-[10px] uppercase tracking-[0.3em]">Select Category</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { onSelectCategory(null); onClose(); }}
                className={cn(
                  "py-4 rounded-sm border font-heading text-xs tracking-widest uppercase transition-all",
                  !selectedCategory ? "bg-bakery-accent text-bakery-dark border-bakery-accent" : "border-bakery-cream/10 text-bakery-cream/60"
                )}
              >
                All Products
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { onSelectCategory(cat); onClose(); }}
                  className={cn(
                    "py-4 rounded-sm border font-heading text-xs tracking-widest uppercase transition-all",
                    selectedCategory === cat ? "bg-bakery-accent text-bakery-dark border-bakery-accent" : "border-bakery-cream/10 text-bakery-cream/60"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Quick-Filter Stamps */}
          <div className="space-y-4">
            <p className="font-body text-bakery-cream/40 text-[10px] uppercase tracking-[0.3em]">Mentorship Shortcuts</p>
            <div className="flex flex-wrap gap-4">
              <div className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                <ProductBadge type="beginner-friendly" size="md" />
              </div>
              <div className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                <ProductBadge type="sims-secret" size="md" />
              </div>
              <div className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                <ProductBadge type="sourdough-essential" size="md" />
              </div>
            </div>
          </div>

          {/* Result Counter & Footer */}
          <div className="pt-6 border-t border-bakery-cream/5 text-center">
            <p className="font-body text-bakery-cream/30 text-[10px] tracking-widest uppercase mb-6">
              Showing {totalProducts} Curated Items
            </p>
            <button
              onClick={onClose}
              className="w-full bg-bakery-accent text-bakery-dark py-5 font-heading text-xl tracking-[0.2em] rounded-sm"
            >
              VIEW COLLECTION
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
