import type { Product } from '@/types/product'
import { absoluteUrl } from '@/lib/site'

/**
 * Builds one schema.org Product node per item for the Products page, so
 * Google can show price/availability in search results. Rendered server-side
 * from the full fetched list (not the client-filtered/paginated view), so
 * every product is indexed regardless of what a visitor's browser is doing.
 */
export function productListJsonLd(products: Product[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': products.map((product) => ({
      '@type': 'Product',
      name: product.name,
      description: product.description || undefined,
      image: product.imageUrl.startsWith('http') ? product.imageUrl : absoluteUrl(product.imageUrl),
      category: product.category,
      // Omit the Offer entirely when there's no price rather than
      // publishing a fabricated one — an Offer with no price is invalid.
      ...(product.price !== undefined && {
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'MYR',
          availability: product.inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        },
      }),
    })),
  }
}
