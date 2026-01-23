'use client'

import { useState, useEffect } from 'react'
import type { Product } from '@/types/product'
import { fetchProducts } from '@/lib/firebase/products'
import { getUniqueCategoriesFromProducts } from '@/lib/firebase/categories'
import ProductFilterSidebar from '@/components/products/ProductFilterSidebar'
import ProductCard from '@/components/products/ProductCard'
import ProductModal from '@/components/products/ProductModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
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

  // Filter products when category changes
  useEffect(() => {
    if (selectedCategory === null) {
      setFilteredProducts(products)
    } else {
      setFilteredProducts(
        products.filter((product) => product.category === selectedCategory)
      )
    }
  }, [selectedCategory, products])

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
      <section className="relative bg-gradient-to-b from-bakery-brown to-bakery-dark py-16 mb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
          <h1 className="font-heading text-bakery-cream text-4xl sm:text-5xl md:text-6xl mb-4 tracking-wider animate-fade-in-up">
            OUR PRODUCTS
          </h1>
          <p className="font-body text-bakery-cream/80 text-lg sm:text-xl max-w-2xl mx-auto animate-fade-in-delayed">
            Premium baking supplies, ingredients, and tools for all your baking needs
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="font-body text-bakery-cream/70 text-lg">{error}</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar - Hidden on mobile, visible on large screens */}
            <div className="hidden lg:block">
              <ProductFilterSidebar
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </div>

            {/* Mobile Filter Dropdown */}
            <div className="lg:hidden mb-6 col-span-full">
              <div className="bg-bakery-cream rounded-lg p-4 shadow-md">
                <label htmlFor="category-select" className="font-heading text-bakery-brown text-lg mb-2 block">
                  Filter by Category:
                </label>
                <select
                  id="category-select"
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="w-full px-4 py-2 rounded-md bg-white border border-bakery-brown/20 text-bakery-brown font-body focus:outline-none focus:ring-2 focus:ring-bakery-accent"
                >
                  <option value="">All Products</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Grid */}
            <div className="lg:col-span-3">
              {/* Results Count */}
              <div className="flex items-center justify-between mb-6">
                <p className="font-body text-bakery-cream/70">
                  Showing <span className="text-bakery-accent font-medium">{filteredProducts.length}</span> products
                  {selectedCategory && (
                    <span className="ml-2">
                      in <span className="text-bakery-accent font-medium">{selectedCategory}</span>
                    </span>
                  )}
                </p>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="font-body text-bakery-cream/70 text-lg">
                    No products found
                    {selectedCategory && (
                      <>
                        {' '}in category <span className="text-bakery-accent">{selectedCategory}</span>
                      </>
                    )}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={() => handleProductClick(product)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
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
