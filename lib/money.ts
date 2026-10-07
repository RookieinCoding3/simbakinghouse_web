// Money is integer sen everywhere new code stores or adds it (RM 12.50 =
// 1250). Parsing goes straight from the typed string to an integer, never
// through a float, so "0.1" + "0.2" is exactly 30 sen.

/** "12", "12.5", "12.50", "RM 12.50" -> 1250. Null for anything else
 *  (negative, more than 2 decimals, text). */
export function parseRMToSen(input: string): number | null {
  const s = input.trim().replace(/^RM\s*/i, '').replace(/,/g, '')
  const m = s.match(/^(\d{1,7})(?:\.(\d{1,2}))?$/)
  if (!m) return null
  const whole = Number(m[1])
  const frac = Number((m[2] ?? '').padEnd(2, '0') || '0')
  return whole * 100 + frac
}

/** Legacy product docs store `price` as an RM float (e.g. 6.5). */
export function rmFloatToSen(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null
  return Math.round(value * 100)
}

export function senToRMString(sen: number): string {
  const sign = sen < 0 ? '-' : ''
  const abs = Math.abs(sen)
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
}

export function formatSen(sen: number | null): string {
  return sen === null ? 'Ask for price' : `RM ${senToRMString(sen)}`
}

/** For fields that still store RM floats for older readers (estimatedTotal). */
export function senToRMFloat(sen: number): number {
  return sen / 100
}
