import { fetchProducts } from '@/lib/firebase/products'
import { enhanceWithDemoData } from '@/lib/demo/mentorData'
import ProductsPageClient from '@/components/products/ProductsPageClient'

// Regenerate at most every 5 minutes so stock/price edits show up quickly
// without every visitor hitting Firestore directly.
export const revalidate = 300

export default async function ProductsPage() {
  // Intentionally not caught here: a thrown error propagates to error.tsx
  // for a first-time/no-cache request, while a background ISR revalidation
  // that throws leaves the last successfully generated page in place. Either
  // way a genuinely empty (but successful) fetch must NOT be conflated with
  // a failure, or a real "no products" state would look like a fetch error.
  const products = await fetchProducts()
  const enhancedProducts = enhanceWithDemoData(products)

  return <ProductsPageClient initialProducts={enhancedProducts} />
}
