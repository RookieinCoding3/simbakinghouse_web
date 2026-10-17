import type { StringKey } from '@/lib/i18n/strings'

// Storefront collections. Sim ticks them per product in the editor
// (product doc `collections`); the inventory Cloud Function copies them to
// publicCatalog. A collection with no products is not shown.
export const COLLECTIONS = [
  { id: 'first-time', title: 'col.first-time.title', body: 'col.first-time.body', adminLabel: 'Baking for the first time?' },
  { id: 'bundles', title: 'col.bundles.title', body: 'col.bundles.body', adminLabel: 'Baking bundles' },
  { id: 'regulars', title: 'col.regulars.title', body: 'col.regulars.body', adminLabel: 'For regulars and home businesses' },
] as const satisfies readonly { id: string; title: StringKey; body: StringKey; adminLabel: string }[]

export type CollectionId = (typeof COLLECTIONS)[number]['id']
export const COLLECTION_IDS: readonly string[] = COLLECTIONS.map((c) => c.id)

/** Known ids only, no duplicates, in the table's order. */
export function readCollections(v: unknown): CollectionId[] {
  const set = new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
  return COLLECTIONS.map((c) => c.id).filter((id) => set.has(id))
}

/** Products per collection; empty collections are left out. */
export function groupByCollection<P extends { collections?: readonly string[] }>(products: P[]) {
  return COLLECTIONS.map((c) => ({ ...c, products: products.filter((p) => p.collections?.includes(c.id)) })).filter((g) => g.products.length > 0)
}
