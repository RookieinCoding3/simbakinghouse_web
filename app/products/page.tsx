'use client'

import { useState, useEffect } from 'react'
import type { Product } from '@/types/product'
import { fetchProducts } from '@/lib/firebase/products'
import { getUniqueCategoriesFromProducts } from '@/lib/firebase/categories'
import CategoryNav from '@/components/products/CategoryNav'
import ProductCard from '@/components/products/ProductCard'
import ProductModal from '@/components/products/ProductModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const fetchedProducts = await fetchProducts()
        setProducts(fetchedProducts)
        setFilteredProducts(fetchedProducts)

        // Extract unique categories from products
        const uniqueCategories = getUniqueCategoriesFromProducts(fetchedProducts)
        setCategories(uniqueCategories)
      } catch (err: any) {
        console.error('Error loading products:', err)
        setError(err.message || 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  // Filter products when category or search changes
  useEffect(() => {
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

    setFilteredProducts(result)
  }, [selectedCategory, searchQuery, products])

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  return (
    <main className="min-h-screen bg-bakery-dark pt-24 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-bakery-brown to-bakery-dark py-16 mb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
          <h1 className="font-heading text-bakery-cream text-4xl sm:text-5xl md:text-6xl mb-4 tracking-wider">
            DISCOVER OUR COLLECTION
          </h1>
          <p className="font-body text-bakery-cream/80 text-lg sm:text-xl max-w-2xl mx-auto mb-8">
            Premium baking supplies, ingredients, and tools for all your baking needs
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, ingredients, tools..."
                className="w-full px-6 py-4 pr-12 bg-bakery-cream/10 backdrop-blur-sm border border-bakery-cream/20 rounded-full text-bakery-cream placeholder:text-bakery-cream/40 font-body focus:outline-none focus:ring-2 focus:ring-bakery-accent transition-all"
              />
              <svg
                className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-bakery-accent"
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

      {/* Category Navigation */}
      {!loading && !error && (
        <CategoryNav
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mt-12">
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
            {/* Results Count */}
            <div className="flex items-center justify-between mb-8">
              <p className="font-body text-bakery-cream/70">
                Showing <span className="text-bakery-accent font-medium">{filteredProducts.length}</span>{' '}
                {filteredProducts.length === 1 ? 'product' : 'products'}
                {selectedCategory && (
                  <span className="ml-2">
                    in <span className="text-bakery-accent font-medium">{selectedCategory}</span>
                  </span>
                )}
                {searchQuery && (
                  <span className="ml-2">
                    for "<span className="text-bakery-accent font-medium">{searchQuery}</span>"
                  </span>
                )}
              </p>
              {(selectedCategory || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory(null)
                    setSearchQuery('')
                  }}
                  className="font-body text-bakery-accent text-sm hover:text-bakery-accent/80 transition-colors underline"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="font-body text-bakery-cream/70 text-lg mb-4">No products found</p>
                <button
                  onClick={() => {
                    setSelectedCategory(null)
                    setSearchQuery('')
                  }}
                  className="font-body text-bakery-accent hover:text-bakery-accent/80 transition-colors underline"
                >
                  Clear filters and show all products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => handleProductClick(product)}
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
    </main>
  )
}
