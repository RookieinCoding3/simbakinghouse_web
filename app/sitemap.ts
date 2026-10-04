import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Static public pages only. Products have no URL of their own — they open
// in a modal on /products (see lib/structuredData.ts's own comment on
// this) — so there's nothing per-product to list here yet. See
// docs/FUTURE_ENHANCEMENTS.md for /products/[slug] as a proposed future
// item, which would also get added here once it exists.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const pages: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/products', changeFrequency: 'daily', priority: 0.9 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/location', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
  ]

  return pages.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))
}
