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
    <main className="min-h-screen bg-bakery-dark pt-24 pb-24 md:pb-16">
      {/* Hero Section - Compact for Mobile */}
      <section className="relative bg-gradient-to-b from-bakery-brown to-bakery-dark py-6 md:py-16 mb-2 md:mb-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-bakery-cream text-2xl sm:text-5xl md:text-6xl mb-1 md:mb-4 tracking-wider">
            OUR COLLECTION
          </h1>
          <p className="hidden md:block font-body text-bakery-cream/80 text-sm md:text-xl max-w-2xl mx-auto mb-8">
            Premium baking supplies personally curated for your road.
          </p>

          {/* Search Bar - Slimmer on Mobile */}
          <div className="max-w-xl mx-auto mt-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ingredients..."
                className="w-full px-5 py-2.5 md:py-4 bg-bakery-cream/5 border border-bakery-cream/10 rounded-full text-bakery-cream placeholder:text-bakery-cream/40 font-body text-xs md:text-base focus:outline-none focus:ring-1 focus:ring-bakery-accent/50 transition-all"
              />
              <svg
                className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-bakery-accent/60"
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

      {/* Sim's Choice Spotlight */}
      {!loading && !error && featuredProducts.length > 0 && !selectedCategory && !searchQuery && (
        <SimsChoiceSpotlight
          products={featuredProducts}
          onProductClick={handleProductClick}
          title="Sim's Starter Kit"
          subtitle="Everything you need to begin your baking journey"
        />
      )}

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-7xl mt-4 md:mt-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="font-body text-bakery-cream/70 text-lg">{error}</p>
          </div>
        ) : (
          <>
            {/* Results Count - Minimalist */}
            <div className="flex items-center justify-between mb-4 md:mb-8">
              <p className="font-body text-bakery-cream/50 text-[10px] md:text-sm uppercase tracking-widest">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
                {selectedCategory && (
                  <span className="ml-1 text-bakery-accent">in {selectedCategory}</span>
                )}
              </p>
              {(selectedCategory || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory(null)
                    setSearchQuery('')
                  }}
                  className="font-body text-bakery-accent/70 text-[10px] md:text-xs uppercase tracking-widest hover:text-bakery-accent transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Product Grid - Tighter gaps on mobile */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 md:py-20">
                <p className="font-body text-bakery-cream/70 text-base md:text-lg mb-3 md:mb-4">No products found</p>
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
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Minimalist Mobile Filter Trigger */}
      <button
        onClick={() => setIsFilterOpen(true)}
        className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-bakery-accent text-bakery-dark px-8 py-4 rounded-full font-heading text-sm tracking-[0.2em] shadow-[0_10px_30px_rgba(212,165,116,0.4)] flex items-center gap-2 animate-fade-in-up"
      >
        <span className="text-[10px]">✨</span> FILTER COLLECTION
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
