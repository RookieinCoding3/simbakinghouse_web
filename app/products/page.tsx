'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { Product } from '@/types/product'
import { fetchProducts } from '@/lib/firebase/products'
import { getUniqueCategoriesFromProducts } from '@/lib/firebase/categories'
import { enhanceWithDemoData } from '@/lib/demo/mentorData'
import { logSearchQuery, logCategoryFilter } from '@/lib/firebase/analytics'
import CategoryNav from '@/components/products/CategoryNav'
import ProductCard from '@/components/products/ProductCard'
import ProductModal from '@/components/products/ProductModal'
import SimsChoiceSpotlight from '@/components/products/SimsChoiceSpotlight'
import MobileFilterDrawer from '@/components/products/MobileFilterDrawer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Debounce timer ref for search logging
  const searchLogTimer = useRef<NodeJS.Timeout | null>(null)

  // Fetch products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const fetchedProducts = await fetchProducts()
        // Enhance with demo mentor data
        const enhancedProducts = enhanceWithDemoData(fetchedProducts)
        setProducts(enhancedProducts)

        // Extract unique categories from products
        const uniqueCategories = getUniqueCategoriesFromProducts(enhancedProducts)
        setCategories(uniqueCategories)
      } catch (err: any) {
        setError(err.message || 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

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
    <main className="min-h-screen bg-bakery-dark pt-20">
      {/* 1. Minimal Hero - Very compact on mobile */}
      <section className="py-8 md:py-16 text-center px-4">
        <h1 className="font-heading text-bakery-cream text-3xl md:text-7xl tracking-wide">
          COLLECTION
        </h1>
        <p className="font-body text-bakery-cream/40 text-xs md:text-lg mt-2 italic uppercase tracking-widest">
          {products.length > 0 ? `${products.length} items` : ''} personally curated for your road
        </p>

        {/* Search Bar - Hidden on mobile (use filter drawer instead) */}
        <div className="hidden md:block max-w-xl mx-auto mt-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ingredients..."
              className="w-full px-6 py-4 bg-bakery-cream/5 border border-bakery-cream/10 rounded-full text-bakery-cream placeholder:text-bakery-cream/40 font-body text-base focus:outline-none focus:ring-1 focus:ring-bakery-accent/50 transition-all"
            />
            <svg
              className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-bakery-accent/60"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </section>

      {/* Category Navigation - Desktop Only */}
      {!loading && !error && (
        <div className="hidden md:block">
          <CategoryNav
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      )}

      {/* Sim's Choice Spotlight - Desktop only to reduce mobile clutter */}
      {!loading && !error && featuredProducts.length > 0 && !selectedCategory && !searchQuery && (
        <div className="hidden md:block">
          <SimsChoiceSpotlight
            products={featuredProducts}
            onProductClick={handleProductClick}
            title="Sim's Starter Kit"
            subtitle="Everything you need to begin your baking journey"
          />
        </div>
      )}

      {/* 2. THE FIX: Light & Airy Grid Section for Mobile */}
      {/* Cream background on mobile to reduce visual fatigue, dark on desktop */}
      <section className="bg-bakery-cream md:bg-transparent rounded-t-[2.5rem] md:rounded-none">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-10 md:py-12">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="font-body text-bakery-brown/70 md:text-bakery-cream/70 text-lg">{error}</p>
            </div>
          ) : (
            <>
              {/* Results Info Bar */}
              <div className="flex justify-between items-center mb-6 md:mb-8 px-1">
                <p className="font-body text-[10px] md:text-sm uppercase tracking-widest text-bakery-brown/50 md:text-bakery-cream/50">
                  Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'bake' : 'bakes'}
                  {selectedCategory && (
                    <span className="ml-1 text-bakery-accent">in {selectedCategory}</span>
                  )}
                </p>

                {/* Mobile Filter Button - Inline */}
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="md:hidden font-heading text-bakery-brown text-sm tracking-widest border-b border-bakery-brown/30 pb-0.5 hover:border-bakery-accent hover:text-bakery-accent transition-colors"
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
                    className="hidden md:block font-body text-bakery-accent/70 text-xs uppercase tracking-widest hover:text-bakery-accent transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Product Grid */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 md:py-20">
                  <p className="font-body text-bakery-brown/70 md:text-bakery-cream/70 text-base md:text-lg mb-3 md:mb-4">
                    No products found
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory(null)
                      setSearchQuery('')
                    }}
                    className="font-body text-bakery-accent hover:text-bakery-accent/80 transition-colors underline text-sm md:text-base"
                  >
                    Clear filters and show all
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
                  {filteredProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={() => handleProductClick(product)}
                      animationDelay={index < 20 ? index * 50 : undefined}
                      responsiveTheme={true}
                    />
                  ))}
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

      {/* Floating Mobile Filter Button - Only show when scrolled */}
      <button
        onClick={() => setIsFilterOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-bakery-brown text-bakery-cream rounded-full shadow-lg flex items-center justify-center hover:bg-bakery-dark transition-colors"
        aria-label="Open filters"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
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
