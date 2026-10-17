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
import { matchesSearch } from '@/lib/storefront/search'
import { COLLECTIONS, readCollections } from '@/lib/storefront/collections'
import { useLang } from '@/lib/i18n/LangContext'
import { useStorefrontSettings, waLink } from '@/components/storefront/StorefrontSettings'
import { WhatsAppIcon } from '@/components/storefront/AskSimSection'

// Psychology: Show 12 items at a time to prevent choice overload
const ITEMS_PER_PAGE = 12

interface ProductsPageClientProps {
  initialProducts: Product[]
}

export default function ProductsPageClient({ initialProducts }: ProductsPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  // What is in the box, including an unfinished Chinese IME composition;
  // the list only filters on committed text (searchQuery).
  const [draft, setDraft] = useState('')
  const composing = useRef(false)
  const [collection, setCollection] = useState<string | null>(null)
  const { t } = useLang()
  const { whatsappNumber } = useStorefrontSettings()
  const setQuery = useCallback((q: string) => {
    setDraft(q)
    setSearchQuery(q)
  }, [])

  // ?search= (Google sitelinks search) and ?collection= (home page links).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('search')
    if (q) setQuery(q)
    const c = readCollections([params.get('collection')])[0]
    if (c) setCollection(c)
    // ?product= (home page collection cards): open that product right away.
    const pid = params.get('product')
    const p = pid ? initialProducts.find((x) => x.id === pid) : undefined
    if (p) {
      setSelectedProduct(p)
      setIsModalOpen(true)
    }
  }, [setQuery, initialProducts])
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
  }, [selectedCategory, searchQuery, collection])

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

    if (collection !== null) {
      result = result.filter((product) => product.collections?.includes(collection))
    }

    // Live search: English or Chinese name, code, description, category.
    if (searchQuery.trim()) {
      result = result.filter((product) => matchesSearch(product, searchQuery))
    }

    return result
  }, [selectedCategory, searchQuery, products, collection])

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
          {t('products.title')}
        </h1>

        {/* THE SEARCH BAR - Minimalist & Clean */}
        <div className="max-w-md mx-auto relative group">
          <label htmlFor="product-search" className="sr-only">{t('search.label')}</label>
          <input
            id="product-search"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              if (!composing.current) setSearchQuery(e.target.value)
            }}
            onCompositionStart={() => {
              composing.current = true
            }}
            onCompositionEnd={(e) => {
              composing.current = false
              setSearchQuery(e.currentTarget.value)
            }}
            placeholder={t('search.placeholder')}
            data-testid="product-search"
            className="w-full bg-white border border-line py-4 pl-6 pr-12 text-ink placeholder:text-ink/40 font-body text-base focus:outline-none focus:border-ink/40 transition-all"
          />
          {draft && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('search.clear')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-ink/50 hover:text-ink"
            >
              ✕
            </button>
          )}
        </div>
        {collection && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setCollection(null)}
              className="inline-flex items-center gap-2 border border-ink px-4 py-2 text-xs text-ink"
              data-testid="collection-filter"
            >
              {t(COLLECTIONS.find((c) => c.id === collection)!.title)} <span aria-hidden="true">✕</span>
            </button>
          </div>
        )}
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
      {featuredProducts.length > 0 && !selectedCategory && !searchQuery && !collection && (
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
              {t('products.showing', { shown: displayedProducts.length, total: filteredProducts.length })}
              {selectedCategory && (
                <span className="ml-1 text-clay">in {selectedCategory}</span>
              )}
            </p>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="md:hidden font-body text-ink text-xs uppercase font-medium tracking-widest border border-ink px-4 min-h-[40px] hover:bg-sand transition-colors"
            >
              {t('products.categories')}
            </button>

            {/* Desktop Clear Button */}
            {(selectedCategory || searchQuery || collection) && (
              <button
                onClick={() => {
                  setSelectedCategory(null)
                  setQuery('')
                  setCollection(null)
                }}
                className="hidden md:block font-body text-clay/70 text-xs uppercase tracking-widest hover:text-clay transition-colors"
              >
                {t('products.clear')}
              </button>
            )}
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 md:py-20">
              <p className="font-body text-ink/70 text-base md:text-lg mb-4" data-testid="search-none">
                {searchQuery.trim() ? t('search.none', { q: searchQuery.trim() }) : t('products.none')}
              </p>
              {searchQuery.trim() && (
                <a
                  href={waLink(whatsappNumber, t('search.askPrefill', { q: searchQuery.trim() }))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#1F7A4D] hover:bg-[#186640] text-white px-6 py-3 text-sm font-semibold mb-6 min-h-[48px]"
                  data-testid="search-ask-sim"
                >
                  <WhatsAppIcon />
                  {t('search.askSim')}
                </a>
              )}
              <br />
              <button
                onClick={() => {
                  setSelectedCategory(null)
                  setQuery('')
                  setCollection(null)
                }}
                className="font-body text-clay hover:text-clay/80 transition-colors underline text-sm"
              >
                {t('products.showAll')}
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
                    You&apos;ve explored {displayedProducts.length} of {filteredProducts.length} products
                  </p>
                  <button
                    onClick={loadMore}
                    className="group relative inline-flex items-center gap-4 px-12 py-5 border border-ink text-ink font-body font-medium uppercase tracking-[0.2em] text-xs hover:bg-ink hover:text-paper transition-all duration-500"
                  >
                    <span>{t('products.more')}</span>
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
                    You&apos;ve seen all {filteredProducts.length} products
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


      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategoryChange}
        collections={COLLECTIONS.map((c) => c.id).filter((id) => products.some((p) => p.collections?.includes(id)))}
        onSelectCollection={(id) => setCollection(id)}
        totalProducts={filteredProducts.length}
      />
    </main>
  )
}
