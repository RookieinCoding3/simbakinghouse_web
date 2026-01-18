import type { Metadata } from 'next'
import ProductsSection from '@/components/sections/ProductsSection'

export const metadata: Metadata = {
  title: 'Our Products | Sim Baking House',
  description:
    'Browse our complete collection of handcrafted breads, pastries, and cakes from Sim Baking House in Penang.',
  keywords: 'bakery products, artisan bread, pastries, cakes, Penang bakery',
}

export default function ProductsPage() {
  return (
    <main className="min-h-screen pt-16 md:pt-20">
      <ProductsSection />
    </main>
  )
}
