// Sale events (settings/promotions, public read like the rest of settings).
// Three templates: a product badge (+ optional % off), Mix & Match ("any 3
// for RM 25") and Spend X get Y off. Money in sen; dates are KL days.

export type PromoType = 'PRODUCT_BADGE' | 'MIX_AND_MATCH' | 'SPEND_THRESHOLD'
export type BadgeColor = 'red' | 'amber' | 'forest' | 'terracotta'

export interface SaleEventPromo {
  id: string
  name: string
  active: boolean
  type: PromoType
  startDate?: string // YYYY-MM-DD, inclusive
  endDate?: string // YYYY-MM-DD, inclusive
  badgeConfig?: {
    badgeTextEn: string
    badgeTextZh?: string
    badgeColor: BadgeColor
    productIds: string[]
    discountPercent?: number // 1..90; omitted = badge only
  }
  mixMatchConfig?: {
    eligibleProductIds: string[]
    requiredQty: number // 2..20
    bundlePriceSen: number
    promptTextEn: string // may contain {remaining}
    promptTextZh: string
  }
  thresholdConfig?: {
    minSpendSen: number
    discountSen: number
    upsellThresholdSen: number
  }
}

export interface PromotionsDoc {
  promos: SaleEventPromo[]
}

export const BADGE_COLORS: Record<BadgeColor, { bg: string; fg: string; label: string }> = {
  red: { bg: '#B42318', fg: '#FFFFFF', label: 'Red' },
  amber: { bg: '#B54708', fg: '#FFFFFF', label: 'Amber' },
  forest: { bg: '#1F5E3B', fg: '#FFFFFF', label: 'Forest' },
  terracotta: { bg: '#9A4A2E', fg: '#FFFFFF', label: 'Terracotta' },
}
