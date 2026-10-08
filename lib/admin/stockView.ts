import type { AdminProduct } from './productsStore'
import type { InventoryDoc, CountDraft } from './collectionStore'
import { deriveStockStatus } from '@/lib/inventory/catalog'

export const RECOUNT_AFTER_DAYS = 30

export type StockLabel = 'OK' | 'Low' | 'Out'

export interface StockRow {
  product: AdminProduct
  managed: boolean
  onHandMilli: number
  reservedMilli: number
  availableMilli: number
  label: StockLabel | null
  lastCountedAt: number | null
  needsRecount: boolean
  draft: CountDraft | null
}

export function buildStockRows(
  products: AdminProduct[],
  inventory: Map<string, InventoryDoc> | null,
  drafts: Map<string, CountDraft> | null,
  now = Date.now()
): StockRow[] {
  return products.map((product) => {
    const inv = inventory?.get(product.id)
    const managed = product.config.managed
    const onHand = inv?.onHandMilli ?? 0
    const reserved = inv?.reservedMilli ?? 0
    const available = onHand - reserved
    const status = managed ? deriveStockStatus(available, product.config.lowStockThresholdMilli) : null
    const lastCountedAt = inv?.lastCountedAt ?? null
    return {
      product,
      managed,
      onHandMilli: onHand,
      reservedMilli: reserved,
      availableMilli: available,
      label: status === null ? null : status === 'out' ? 'Out' : status === 'low' ? 'Low' : 'OK',
      lastCountedAt,
      needsRecount: managed && (lastCountedAt === null || now - lastCountedAt > RECOUNT_AFTER_DAYS * 86400_000),
      draft: drafts?.get(product.id) ?? null,
    }
  })
}

export function daysAgo(ms: number | null, now = Date.now()): string {
  if (ms === null) return 'never'
  const d = Math.floor((now - ms) / 86400_000)
  return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`
}

export function newOpId(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
