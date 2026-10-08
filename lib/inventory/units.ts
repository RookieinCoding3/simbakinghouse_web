// Stock quantities are integer milli-units of the product's base unit
// (2.5 kg = 2500 when the base unit is kg; 3 pc = 3000). Integers only, so
// sums are exact: 0.1 kg + 0.2 kg = 100 + 200 = 300 = 0.3 kg, always.

export const MILLI = 1000

/** "2", "2.5", "0.125" -> milli-units. Null for negatives, text, or more
 *  than 3 decimals. `allowNegative` for typed adjustments like "-2". */
export function parseQtyToMilli(input: string, { allowNegative = false } = {}): number | null {
  const s = input.trim().replace(/,/g, '')
  const m = s.match(/^(-)?(\d{1,9})(?:\.(\d{1,3}))?$/)
  if (!m) return null
  if (m[1] && !allowNegative) return null
  const value = Number(m[2]) * MILLI + Number((m[3] ?? '').padEnd(3, '0') || '0')
  return m[1] ? -value : value
}

/** 2500 -> "2.5"; 3000 -> "3"; -500 -> "-0.5". */
export function milliToString(milli: number): string {
  const sign = milli < 0 ? '-' : ''
  const abs = Math.abs(milli)
  const whole = Math.floor(abs / MILLI)
  const frac = abs % MILLI
  if (frac === 0) return `${sign}${whole}`
  return `${sign}${whole}.${String(frac).padStart(3, '0').replace(/0+$/, '')}`
}

export function formatQty(milli: number, unit: string): string {
  return `${milliToString(milli)} ${unit}`.trim()
}

export const BASE_UNITS = ['pc', 'kg', 'g', 'L', 'ml', 'bag', 'box', 'pack', 'tin', 'bottle'] as const
