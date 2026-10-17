import type { Product } from '@/types/product'

// Client-side product search: English name, Chinese name, code,
// description and category. Every word typed must match somewhere.
// Codes also match without spaces/dashes ("f 00002", "F-00002").

export function normalizeForSearch(s: string): string {
  return s.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
}

const compact = (s: string) => s.replace(/[\s\-_.]/g, '')

/** Edit distance, stopping early once it exceeds `max`. */
export function withinEdits(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      best = Math.min(best, cur[j])
    }
    if (best > max) return false
    prev = cur
  }
  return prev[b.length] <= max
}

/** Typo tolerance for Latin words of 4+ letters ("flor" → flour,
 *  "choclate" → chocolate): one typo, two for words of 8+ letters. */
function fuzzyWord(word: string, tokens: string[]): boolean {
  if (word.length < 4 || !/^[a-z]+$/.test(word)) return false
  const max = word.length >= 8 ? 2 : 1
  return tokens.some((t) => t.length >= 4 && (withinEdits(word, t, max) || (t.length > word.length && withinEdits(word, t.slice(0, word.length), max))))
}

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
  const tokens = hay.split(/[^a-z0-9]+/).filter(Boolean)
  return q
    .split(' ')
    .every((word) => hay.includes(word) || (code !== '' && code.includes(compact(word)) && compact(word).length >= 3) || fuzzyWord(word, tokens))
}
