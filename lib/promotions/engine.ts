import type { SaleEventPromo } from './types'

// Pricing with sale events. The SAME function prices the cart (display) and
// the order on the server (what is actually charged), so a customer can't
// make up a discount. Unpriced ("Ask for price") lines never get one.

export interface PromoLine {
  key: string // cart line key (product + size)
  productId: string
  qty: number
  unitPriceSen: number | null
}

export interface PromoDiscount {
  promoId: string
  name: string
  type: SaleEventPromo['type']
  discountSen: number
}

export interface PromoResult {
  subtotalSen: number // list prices, priced lines only
  discounts: PromoDiscount[]
  totalDiscountSen: number
  totalSen: number
  /** "Add 1 more item(s) to get 3 for RM25!" per Mix & Match not complete. */
  mixMatchPrompts: { promoId: string; remaining: number; textEn: string; textZh: string }[]
  /** Spend threshold nearly reached (cart ≥ upsell threshold). */
  thresholdPrompt: { promoId: string; remainingSen: number; discountSen: number } | null
}

export function isLive(p: SaleEventPromo, today: string): boolean {
  if (!p.active) return false
  if (p.startDate && today < p.startDate) return false
  if (p.endDate && today > p.endDate) return false
  return true
}

/** The live badge for a product (first matching badge promo). */
export function badgeFor(productId: string, promos: SaleEventPromo[], today: string) {
  for (const p of promos) {
    if (p.type === 'PRODUCT_BADGE' && p.badgeConfig && isLive(p, today) && p.badgeConfig.productIds.includes(productId)) {
      return { promoId: p.id, ...p.badgeConfig }
    }
  }
  return null
}

/** Price after a badge's % off (rounded to the sen). */
export function promoUnitPrice(unitPriceSen: number, discountPercent?: number): number {
  if (!discountPercent) return unitPriceSen
  return Math.round((unitPriceSen * (100 - discountPercent)) / 100)
}

export function applyPromos(lines: PromoLine[], promos: SaleEventPromo[], today: string): PromoResult {
  const live = promos.filter((p) => isLive(p, today))
  const priced = lines.filter((l) => l.unitPriceSen !== null && l.qty > 0) as (PromoLine & { unitPriceSen: number })[]
  const subtotalSen = priced.reduce((s, l) => s + l.unitPriceSen * l.qty, 0)
  const discounts: PromoDiscount[] = []

  // 1) Product badges with % off: per unit, on the list price.
  const unitPrice = new Map<string, number>()
  for (const l of priced) {
    const badge = live.find((p) => p.type === 'PRODUCT_BADGE' && p.badgeConfig?.discountPercent && p.badgeConfig.productIds.includes(l.productId))
    const after = badge ? promoUnitPrice(l.unitPriceSen, badge.badgeConfig!.discountPercent) : l.unitPriceSen
    unitPrice.set(l.key, after)
    if (badge && after < l.unitPriceSen) {
      const d = (l.unitPriceSen - after) * l.qty
      const prev = discounts.find((x) => x.promoId === badge.id)
      if (prev) prev.discountSen += d
      else discounts.push({ promoId: badge.id, name: badge.name, type: badge.type, discountSen: d })
    }
  }

  // 2) Mix & Match: each full group of N eligible items (dearest first) for
  //    the bundle price. An item already in one bundle is not reused.
  const used = new Map<string, number>() // key -> units used
  const mixMatchPrompts: PromoResult['mixMatchPrompts'] = []
  for (const p of live.filter((x) => x.type === 'MIX_AND_MATCH' && x.mixMatchConfig)) {
    const c = p.mixMatchConfig!
    const units: { key: string; price: number }[] = []
    for (const l of priced) {
      if (!c.eligibleProductIds.includes(l.productId)) continue
      const free = l.qty - (used.get(l.key) ?? 0)
      for (let i = 0; i < free; i++) units.push({ key: l.key, price: unitPrice.get(l.key)! })
    }
    units.sort((a, b) => b.price - a.price)
    const groups = Math.floor(units.length / c.requiredQty)
    let discount = 0
    for (let g = 0; g < groups; g++) {
      const group = units.slice(g * c.requiredQty, (g + 1) * c.requiredQty)
      const sum = group.reduce((s, u) => s + u.price, 0)
      if (sum > c.bundlePriceSen) {
        discount += sum - c.bundlePriceSen
        for (const u of group) used.set(u.key, (used.get(u.key) ?? 0) + 1)
      }
    }
    if (discount > 0) discounts.push({ promoId: p.id, name: p.name, type: p.type, discountSen: discount })
    const rest = units.length % c.requiredQty
    if (units.length > 0 && rest > 0) {
      const remaining = c.requiredQty - rest
      mixMatchPrompts.push({ promoId: p.id, remaining, textEn: c.promptTextEn.replace('{remaining}', String(remaining)), textZh: c.promptTextZh.replace('{remaining}', String(remaining)) })
    }
  }

  // 3) Spend threshold: on what is left after 1) and 2); the best one only.
  const afterSoFar = subtotalSen - discounts.reduce((s, d) => s + d.discountSen, 0)
  const thresholds = live.filter((x) => x.type === 'SPEND_THRESHOLD' && x.thresholdConfig)
  const reached = thresholds.filter((p) => afterSoFar >= p.thresholdConfig!.minSpendSen).sort((a, b) => b.thresholdConfig!.discountSen - a.thresholdConfig!.discountSen)[0]
  if (reached) {
    discounts.push({ promoId: reached.id, name: reached.name, type: reached.type, discountSen: Math.min(reached.thresholdConfig!.discountSen, afterSoFar) })
  }
  let thresholdPrompt: PromoResult['thresholdPrompt'] = null
  const next = thresholds
    .filter((p) => afterSoFar < p.thresholdConfig!.minSpendSen && afterSoFar >= p.thresholdConfig!.upsellThresholdSen)
    .filter((p) => !reached || p.thresholdConfig!.discountSen > reached.thresholdConfig!.discountSen)
    .sort((a, b) => a.thresholdConfig!.minSpendSen - b.thresholdConfig!.minSpendSen)[0]
  if (next) thresholdPrompt = { promoId: next.id, remainingSen: next.thresholdConfig!.minSpendSen - afterSoFar, discountSen: next.thresholdConfig!.discountSen }

  const totalDiscountSen = discounts.reduce((s, d) => s + d.discountSen, 0)
  return { subtotalSen, discounts, totalDiscountSen, totalSen: subtotalSen - totalDiscountSen, mixMatchPrompts, thresholdPrompt }
}
