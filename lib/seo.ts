import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/site'

// Next.js replaces (not merges) `openGraph`/`twitter` when a page defines its
// own, so per-page metadata is built here to keep the canonical and og:url in
// step and always derived from SITE_URL.
interface PageMetadataInput {
  path: string
  title?: string
  description?: string
}

export function pageMetadata({ path, title, description }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path)
  return {
    ...(title && { title }),
    ...(description && { description }),
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'en_MY',
      siteName: 'Sim Baking House',
      url,
      ...(title && { title }),
      ...(description && { description }),
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Sim Baking House' }],
    },
    twitter: {
      card: 'summary_large_image',
      ...(title && { title }),
      ...(description && { description }),
      images: ['/og-image.jpg'],
    },
  }
}
