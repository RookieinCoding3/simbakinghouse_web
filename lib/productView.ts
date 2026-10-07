import type { Product, PublicSellUnit } from '@/types/product'

// Shop-side reading of a product's sizes and availability. Products that
// aren't managed in the admin behave exactly as before: the manual inStock
// flag decides, and no stock status is ever shown.

export function productAvailability(p: Product): { sellable: boolean; status: 'in_stock' | 'low' | 'out' | null } {
  if (p.managedStock) {
    const status = p.stockStatus ?? 'out'
    return { sellable: status !== 'out', status }
  }
  return { sellable: p.inStock, status: null }
}

export function onlineUnits(p: Product): PublicSellUnit[] {
  if (p.sellUnits) return p.sellUnits.filter((u) => u.channel !== 'wholesale')
  return [{ id: 'default', label: '', factorMilli: 1000, priceSen: p.price === undefined ? null : Math.round(p.price * 100), channel: 'both' }]
}

export const STOCK_LABEL = { in_stock: 'In stock', low: 'Low stock', out: 'Out of stock' } as const
