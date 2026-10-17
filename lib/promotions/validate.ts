import { BADGE_COLORS, type SaleEventPromo, type PromotionsDoc } from './types'

// Shape check for settings/promotions: used when reading (tolerant: bad
// entries are dropped) and when the admin saves (strict: refused).

const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const ids = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 100))] : [])
const sen = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100_000_00 ? v : null)

export class PromoError extends Error {}

export function parsePromo(raw: unknown, strict = false): SaleEventPromo | null {
  const fail = (msg: string): null => {
    if (strict) throw new PromoError(msg)
    return null
  }
  if (!raw || typeof raw !== 'object') return fail('Bad promotion.')
  const r = raw as Record<string, unknown>
  const id = str(r.id, 60)
  const name = str(r.name, 80)
  if (!id) return fail('A promotion is missing its id.')
  if (!name) return fail('Give the sale a name.')
  const base = {
    id,
    name,
    active: r.active === true,
    ...(isDay(r.startDate) ? { startDate: r.startDate } : {}),
    ...(isDay(r.endDate) ? { endDate: r.endDate } : {}),
  }
  if (base.startDate && base.endDate && base.endDate < base.startDate) return fail(`"${name}": the end date is before the start date.`)
  if (r.type === 'PRODUCT_BADGE') {
    const c = (r.badgeConfig ?? {}) as Record<string, unknown>
    const badgeTextEn = str(c.badgeTextEn, 24)
    const productIds = ids(c.productIds)
    const color = typeof c.badgeColor === 'string' && c.badgeColor in BADGE_COLORS ? (c.badgeColor as keyof typeof BADGE_COLORS) : 'red'
    const pct = c.discountPercent === undefined || c.discountPercent === null || c.discountPercent === '' ? undefined : Number(c.discountPercent)
    if (!badgeTextEn) return fail(`"${name}": enter the badge text.`)
    if (!productIds.length) return fail(`"${name}": choose at least one product.`)
    if (pct !== undefined && (!Number.isInteger(pct) || pct < 1 || pct > 90)) return fail(`"${name}": % off must be 1 to 90.`)
    return { ...base, type: 'PRODUCT_BADGE', badgeConfig: { badgeTextEn, badgeTextZh: str(c.badgeTextZh, 24) || undefined, badgeColor: color, productIds, ...(pct ? { discountPercent: pct } : {}) } }
  }
  if (r.type === 'MIX_AND_MATCH') {
    const c = (r.mixMatchConfig ?? {}) as Record<string, unknown>
    const eligibleProductIds = ids(c.eligibleProductIds)
    const requiredQty = Number(c.requiredQty)
    const bundlePriceSen = sen(c.bundlePriceSen)
    if (eligibleProductIds.length < 2) return fail(`"${name}": choose at least two products for the pool.`)
    if (!Number.isInteger(requiredQty) || requiredQty < 2 || requiredQty > 20) return fail(`"${name}": "pick how many" must be 2 to 20.`)
    if (!bundlePriceSen) return fail(`"${name}": enter the bundle price.`)
    return {
      ...base,
      type: 'MIX_AND_MATCH',
      mixMatchConfig: {
        eligibleProductIds,
        requiredQty,
        bundlePriceSen,
        promptTextEn: str(c.promptTextEn, 120) || `Add {remaining} more item(s) to get ${requiredQty} for RM${(bundlePriceSen / 100).toFixed(2)}!`,
        promptTextZh: str(c.promptTextZh, 120) || `再加 {remaining} 件，${requiredQty} 件只要 RM${(bundlePriceSen / 100).toFixed(2)}！`,
      },
    }
  }
  if (r.type === 'SPEND_THRESHOLD') {
    const c = (r.thresholdConfig ?? {}) as Record<string, unknown>
    const minSpendSen = sen(c.minSpendSen)
    const discountSen = sen(c.discountSen)
    const upsell = sen(c.upsellThresholdSen)
    if (!minSpendSen) return fail(`"${name}": enter the minimum spend.`)
    if (!discountSen || discountSen >= minSpendSen) return fail(`"${name}": the discount must be more than 0 and less than the minimum spend.`)
    return { ...base, type: 'SPEND_THRESHOLD', thresholdConfig: { minSpendSen, discountSen, upsellThresholdSen: upsell !== null && upsell < minSpendSen ? upsell : Math.round(minSpendSen * 0.75) } }
  }
  return fail(`"${name}": unknown sale type.`)
}

export function parsePromotions(raw: unknown, strict = false): PromotionsDoc {
  const list = raw && typeof raw === 'object' && Array.isArray((raw as { promos?: unknown }).promos) ? (raw as { promos: unknown[] }).promos : []
  if (strict && list.length > 50) throw new PromoError('Too many sale events (50 at most).')
  const promos = list.map((p) => parsePromo(p, strict)).filter((p): p is SaleEventPromo => p !== null)
  if (strict && new Set(promos.map((p) => p.id)).size !== promos.length) throw new PromoError('Two sale events have the same id.')
  return { promos }
}
