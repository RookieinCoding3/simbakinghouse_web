'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Product } from '@/types/product'
import { fetchProducts } from '@/lib/firebase/products'
import ProductGrid from '@/components/products/ProductGrid'
import ProductModal from '@/components/products/ProductModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchProducts()
        setProducts(data)
      } catch (err) {
        setError('Failed to load products. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedProduct(null), 300)
  }, [])

  return (
    <section
      id="products"
      className="py-16 md:py-24 bg-bakery-dark"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <p className="font-body text-bakery-accent text-sm sm:text-base tracking-widest uppercase mb-2">
            Our Selection
          </p>
          <h2 className="font-heading text-bakery-cream text-4xl sm:text-5xl md:text-6xl mb-4">
            PRODUCTS
          </h2>
          <p className="font-body text-bakery-cream/80 text-lg max-w-2xl mx-auto">
            Explore our handcrafted selection of breads, pastries, and cakes
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner size="lg" />
            <p className="font-body text-bakery-cream/70 mt-4 text-lg">
              Loading our delicious products...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-20">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md mx-auto">
              <svg
                className="w-12 h-12 text-red-500 mx-auto mb-4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-body text-red-400 text-lg">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 font-heading text-bakery-cream hover:text-bakery-accent transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && (
          <ProductGrid products={products} onProductClick={handleProductClick} />
        )}

        {/* Product Modal */}
        <ProductModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    </section>
  )
}
