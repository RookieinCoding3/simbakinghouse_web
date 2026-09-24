import { fetchProducts } from '@/lib/firebase/products'
import { enhanceWithDemoData } from '@/lib/demo/mentorData'
import ProductsPageClient from '@/components/products/ProductsPageClient'
import { pageMetadata } from '@/lib/seo'
import { productListJsonLd } from '@/lib/structuredData'

export const metadata = pageMetadata({
  path: '/products',
  title: 'Products',
  description:
    'Baking ingredients, premixes, tools and decorations from Sim Baking House in Bayan Lepas, Penang.',
})

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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productListJsonLd(enhancedProducts)) }}
      />
      <ProductsPageClient initialProducts={enhancedProducts} />
    </>
  )
}
