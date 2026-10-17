import type { Firestore } from 'firebase-admin/firestore'
import { readPublicSellUnits, readStockConfig } from '@/lib/inventory/catalog'
import { readBatch, type InvBatch } from './invStock'

// One read of everything the stock manager and dashboard show, from the
// shared SBH Inventory collections (Admin SDK: works on today's rules).

export interface StockRow {
  id: string
  name: string
  nameZh: string
  code: string
  category: string
  imageUrl: string
  unit: string
  chilled: boolean
  sellPriceSen: number | null
  onHandMilli: number
  reservedMilli: number
  availableMilli: number
  lowAtMilli: number
  counted: boolean
  latestCostSen: number | null
  batches: (InvBatch & { unitCostSen: number | null })[]
}

/** KL calendar day, YYYY-MM-DD. */
export function klToday(now = Date.now()): string {
  return new Date(now + 8 * 3600_000).toISOString().slice(0, 10)
}
export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export async function loadStock(db: Firestore): Promise<StockRow[]> {
  const [products, levels, batches, costs, batchCosts] = await Promise.all([
    db.collection('products').get(),
    db.collection('stockLevels').get(),
    db.collection('batches').where('qtyMilli', '>', 0).get(),
    db.collection('productCosts').get(),
    db.collection('batchCosts').get(),
  ])
  const level = new Map<string, { on: number; res: number }>()
  for (const d of levels.docs) {
    const id = String(d.get('productId') ?? '')
    const cur = level.get(id) ?? { on: 0, res: 0 }
    level.set(id, { on: cur.on + Number(d.get('onHandMilli') ?? 0), res: cur.res + Number(d.get('reservedMilli') ?? 0) })
  }
  const bcost = new Map(batchCosts.docs.map((d) => [d.id, typeof d.get('unitCostSen') === 'number' ? (d.get('unitCostSen') as number) : null]))
  const byProduct = new Map<string, StockRow['batches']>()
  for (const d of batches.docs) {
    const b = readBatch(d.id, d.data())
    byProduct.set(b.productId, [...(byProduct.get(b.productId) ?? []), { ...b, unitCostSen: bcost.get(b.id) ?? null }])
  }
  const pcost = new Map(costs.docs.map((d) => [d.id, typeof d.get('costPerUnitSen') === 'number' ? (d.get('costPerUnitSen') as number) : null]))
  const rows: StockRow[] = []
  for (const d of products.docs) {
    const p = d.data()
    if (p.isDeleted === true || p.status === 'archived' || p.status === 'draft') continue
    const cfg = readStockConfig(p)
    const units = readPublicSellUnits(p)
    const priced = units.find((u) => u.priceSen !== null)
    const lv = level.get(d.id) ?? { on: 0, res: 0 }
    const sellPriceSen = typeof p.sellPrice === 'number' ? p.sellPrice : priced ? priced.priceSen : null
    rows.push({
      id: d.id,
      name: String(p.name ?? ''),
      nameZh: typeof p.nameZh === 'string' ? p.nameZh : '',
      code: typeof p.code === 'string' ? p.code : '',
      category: String(p.category ?? ''),
      imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : '',
      unit: typeof p.unitLabel === 'string' && p.unitLabel ? p.unitLabel : cfg.baseUnit,
      chilled: p.chilled === true,
      sellPriceSen,
      onHandMilli: lv.on,
      reservedMilli: lv.res,
      availableMilli: lv.on - lv.res,
      lowAtMilli: Math.max(Number(p.reorderLevelMilli ?? 0) || 0, cfg.lowStockThresholdMilli || 0),
      counted: (p.openingCount as { done?: boolean } | undefined)?.done === true || lv.on !== 0 || (byProduct.get(d.id)?.length ?? 0) > 0,
      latestCostSen: pcost.get(d.id) ?? null,
      batches: (byProduct.get(d.id) ?? []).sort((a, b) => (a.expiryDate ?? '9999').localeCompare(b.expiryDate ?? '9999')),
    })
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name))
}

export type StockFlag = 'out' | 'low' | 'expiring' | 'chilled'

export function stockFlags(r: StockRow, today: string, days = 14): StockFlag[] {
  const f: StockFlag[] = []
  if (r.counted && r.availableMilli <= 0) f.push('out')
  else if (r.counted && r.lowAtMilli > 0 && r.availableMilli <= r.lowAtMilli) f.push('low')
  if (r.batches.some((b) => b.expiryDate && b.expiryDate <= addDays(today, days))) f.push('expiring')
  if (r.chilled) f.push('chilled')
  return f
}
