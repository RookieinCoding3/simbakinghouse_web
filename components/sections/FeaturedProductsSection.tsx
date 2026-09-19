'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/types/product'
import { fetchProductsByIds } from '@/lib/firebase/products'
import ProductModal from '@/components/products/ProductModal'

// Top 3 Best Sellers IDs (moved outside component to prevent re-creation)
const BEST_SELLER_IDS = [
  'k7KIV3aYXZG33EDmEqJg',    // Left
  '3pTEcScO5E9hombgGEmL',    // Middle
  '1KAQVQF1g9ZnJhslJ2Wd'     // Right
]

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
        // Fetch the top 3 best sellers by their IDs
        const data = await fetchProductsByIds(BEST_SELLER_IDS)
        setProducts(data)
      } catch (err) {
        setError('Failed to load featured products. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadFeaturedProducts()
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
      id="premixes"
      className="max-w-[1400px] mx-auto px-6 lg:px-12 py-24 border-b border-line"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left: headline */}
        <div className="lg:col-span-4 space-y-6">
          <h2 className="text-xs uppercase tracking-[0.25em] font-semibold text-ink">Essentials for all</h2>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            Our most-loved staples, available daily at our Bayan Lepas storefront or pre-packed for swift morning collection.
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="text-xs uppercase tracking-widest text-ink font-medium inline-flex items-center gap-2 hover:gap-3 transition-all"
            >
              View all products &rarr;
            </Link>
          </div>
        </div>

        {/* Right: product grid */}
        <div className="lg:col-span-8">
          {loading && (
            <div className="grid grid-cols-3 gap-4 sm:gap-8">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="space-y-3 animate-pulse">
                  <div className="aspect-square bg-line" />
                  <div className="h-3 bg-line w-2/3 mx-auto" />
                </div>
              ))}
            </div>
          )}

          {error && !loading && <p className="text-xs text-clay">{error}</p>}

          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-3 gap-4 sm:gap-8">
              {products.slice(0, 3).map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleProductClick(product)}
                  className="group text-center space-y-3"
                >
                  <div className="relative aspect-square bg-white border border-line overflow-hidden">
                    <Image
                      src={product.imageUrl || '/images/placeholder-product.jpg'}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 33vw, 260px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <p className="text-[11px] uppercase tracking-wider text-[#3D3A37] font-medium">
                    {product.name}
                  </p>
                  <p className="text-[11px] tracking-wider text-muted">RM {product.price.toFixed(2)}</p>
                </button>
              ))}
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <p className="text-xs text-muted">No products available at the moment. Check back soon!</p>
          )}
        </div>
      </div>

      <ProductModal product={selectedProduct} isOpen={isModalOpen} onClose={handleCloseModal} />
    </section>
  )
}
