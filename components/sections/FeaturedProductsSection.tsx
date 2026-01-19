'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Product } from '@/types/product'
import { fetchProducts } from '@/lib/firebase/products'
import ProductGrid from '@/components/products/ProductGrid'
import ProductModal from '@/components/products/ProductModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'

export default function FeaturedProductsSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    async function loadFeaturedProducts() {
      try {
        setLoading(true)
        setError(null)
        // Fetch only the first 8 products for the featured section
        const data = await fetchProducts(8)
        console.log('Firestore Data (Featured):', data)
        setProducts(data)
      } catch (err) {
        console.error('Error loading featured products:', err)
        setError('Failed to load featured products. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadFeaturedProducts()
  }, [])

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedProduct(null), 300)
  }

  return (
    <section
      id="featured-products"
      className="py-16 md:py-24 bg-bakery-brown"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <p className="font-body text-bakery-accent text-sm sm:text-base tracking-widest uppercase mb-2">
            Our Selection
          </p>
          <h2 className="font-heading text-bakery-cream text-4xl sm:text-5xl md:text-6xl mb-4">
            FEATURED ESSENTIALS
          </h2>
          <p className="font-body text-bakery-cream/80 text-lg max-w-2xl mx-auto">
            Discover our most popular handcrafted creations
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner size="lg" />
            <p className="font-body text-bakery-cream/70 mt-4 text-lg">
              Loading featured products...
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
            </div>
          </div>
        )}

        {/* Featured Products Grid */}
        {!loading && !error && (
          <>
            <ProductGrid products={products} onProductClick={handleProductClick} />

            {/* View All Products Button */}
            <div className="text-center mt-12">
              <Link href="/products">
                <Button variant="primary" size="lg" className="text-xl">
                  VIEW ALL PRODUCTS
                </Button>
              </Link>
            </div>
          </>
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
