'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type { Product } from '@/types/product'
import { getUniqueCategoriesFromProducts } from '@/lib/firebase/categories'
import { logSearchQuery, logCategoryFilter } from '@/lib/firebase/analytics'
import CategoryNav from '@/components/products/CategoryNav'
import ProductCard from '@/components/products/ProductCard'
import ProductModal from '@/components/products/ProductModal'
import SimsChoiceSpotlight from '@/components/products/SimsChoiceSpotlight'
import MobileFilterDrawer from '@/components/products/MobileFilterDrawer'

// Psychology: Show 12 items at a time to prevent choice overload
const ITEMS_PER_PAGE = 12

interface ProductsPageClientProps {
  initialProducts: Product[]
}

export default function ProductsPageClient({ initialProducts }: ProductsPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Load More state - Psychology: Gives user control and "finish line"
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)

  // Debounce timer ref for search logging
  const searchLogTimer = useRef<NodeJS.Timeout | null>(null)

  const products = initialProducts

  const categories = useMemo(
    () => getUniqueCategoriesFromProducts(products),
    [products]
  )

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE)
  }, [selectedCategory, searchQuery])

  // Track search queries with debounce (log after 1.5s of no typing)
  useEffect(() => {
    if (searchLogTimer.current) {
      clearTimeout(searchLogTimer.current)
    }

    if (searchQuery.trim().length >= 2) {
      searchLogTimer.current = setTimeout(() => {
        logSearchQuery(searchQuery)
      }, 1500)
    }

    return () => {
      if (searchLogTimer.current) {
        clearTimeout(searchLogTimer.current)
      }
    }
  }, [searchQuery])

  // Get featured products for spotlight
  const featuredProducts = useMemo(() => {
    return products.filter(p => p.featured).slice(0, 5)
  }, [products])

  // Filter products when category or search changes (memoized)
  const filteredProducts = useMemo(() => {
    let result = products

    // Filter by category
    if (selectedCategory !== null) {
      result = result.filter((product) => product.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
      )
    }

    return result
  }, [selectedCategory, searchQuery, products])

  // Get currently displayed products (Load More logic)
  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount)
  }, [filteredProducts, visibleCount])

  // Check if there are more products to load
  const hasMore = visibleCount < filteredProducts.length

  // Load more products - Psychology: Dopamine hit from "discovering" more
  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE)
  }, [])

  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }, [])

  // Track category selection for business intelligence
  const handleCategoryChange = useCallback((category: string | null) => {
    setSelectedCategory(category)
    if (category) {
      logCategoryFilter(category)
    }
  }, [])

  return (
    <main className="min-h-screen bg-paper">
      {/* 1. HERO with Search - Clean & Minimal */}
      <section className="py-12 md:py-20 text-center px-4">
        <h1 className="font-heading text-ink text-5xl md:text-7xl mb-8">
          The collection
        </h1>

        {/* THE SEARCH BAR - Minimalist & Clean */}
        <div className="max-w-md mx-auto relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="What are you baking today?"
            className="w-full bg-white border border-line py-4 px-6 text-ink placeholder:text-ink/40 font-body text-sm focus:outline-none focus:border-ink/40 transition-all"
          />
        </div>
      </section>

      {/* Category Navigation - Desktop Only */}
      <div className="hidden md:block">
        <CategoryNav
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      {/* Sim's Choice Spotlight - Desktop only */}
      {featuredProducts.length > 0 && !selectedCategory && !searchQuery && (
        <div className="hidden md:block">
          <SimsChoiceSpotlight
            products={featuredProducts}
            onProductClick={handleProductClick}
            title="Sim's Starter Kit"
            subtitle="Everything you need to begin your baking journey"
          />
        </div>
      )}

      {/* 2. THE LIGHT GRID - Cream background on mobile for fresh feeling */}
      <section className="bg-transparent">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-12">
          {/* Results Info Bar */}
          <div className="flex justify-between items-center mb-8 px-1">
            <p className="font-body text-[10px] md:text-sm uppercase tracking-widest text-ink/50">
              Showing {displayedProducts.length} of {filteredProducts.length} essentials
              {selectedCategory && (
                <span className="ml-1 text-clay">in {selectedCategory}</span>
              )}
            </p>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="md:hidden font-body text-ink text-xs uppercase font-medium tracking-widest border-b border-ink/30 pb-0.5 hover:text-clay transition-colors"
            >
              FILTER
            </button>

            {/* Desktop Clear Button */}
            {(selectedCategory || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory(null)
                  setSearchQuery('')
                }}
                className="hidden md:block font-body text-clay/70 text-xs uppercase tracking-widest hover:text-clay transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 md:py-20">
              <p className="font-body text-ink/70 text-base md:text-lg mb-4">
                No products found
              </p>
              <button
                onClick={() => {
                  setSelectedCategory(null)
                  setSearchQuery('')
                }}
                className="font-body text-clay hover:text-clay/80 transition-colors underline text-sm"
              >
                Clear filters and show all
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                {displayedProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => handleProductClick(product)}
                    index={index}
                    responsiveTheme={true}
                  />
                ))}
              </div>

              {/* LOAD MORE - Psychology: Finish line + Discovery dopamine */}
              {hasMore && (
                <div className="mt-16 md:mt-20 text-center pb-8">
                  <p className="font-body text-ink/50 text-[10px] uppercase tracking-widest mb-6">
                    You&apos;ve explored {displayedProducts.length} of {filteredProducts.length} curated essentials
                  </p>
                  <button
                    onClick={loadMore}
                    className="group relative inline-flex items-center gap-4 px-12 py-5 border border-ink text-ink font-body font-medium uppercase tracking-[0.2em] text-xs hover:bg-ink hover:text-paper transition-all duration-500"
                  >
                    <span>DISCOVER MORE</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>

                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 -z-10 bg-clay/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              )}

              {/* End of Collection Message */}
              {!hasMore && filteredProducts.length > ITEMS_PER_PAGE && (
                <div className="mt-16 text-center pb-8">
                  <p className="font-body text-ink/40 text-[10px] uppercase tracking-widest">
                    You&apos;ve seen all {filteredProducts.length} essentials
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Floating Mobile Filter Button */}
      <button
        onClick={() => setIsFilterOpen(true)}
        className="md:hidden fixed bottom-10 left-1/2 -translate-x-1/2 z-40 bg-ink text-paper px-8 py-4 font-body font-medium text-[11px] uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-clay transition-colors"
      >
        Filter by category
      </button>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategoryChange}
        totalProducts={filteredProducts.length}
      />
    </main>
  )
}
