import type { Product } from '@/types/product'

// Client-side product search: English name, Chinese name, code,
// description and category. Every word typed must match somewhere.
// Codes also match without spaces/dashes ("f 00002", "F-00002").

export function normalizeForSearch(s: string): string {
  return s.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
}

const compact = (s: string) => s.replace(/[\s\-_.]/g, '')

export function matchesSearch(
  p: Pick<Product, 'name' | 'nameZh' | 'code' | 'description' | 'category'>,
  query: string,
): boolean {
  const q = normalizeForSearch(query)
  if (!q) return true
  const fields = [p.name, p.nameZh ?? '', p.code ?? '', p.description, p.category].map(normalizeForSearch)
  const hay = fields.join(' \u0001 ')
  const code = compact(normalizeForSearch(p.code ?? ''))
  if (code && compact(q) === code) return true
  return q.split(' ').every((word) => hay.includes(word) || (code !== '' && code.includes(compact(word)) && compact(word).length >= 3))
}
