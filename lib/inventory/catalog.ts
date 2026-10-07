import { MILLI } from './units'
import { rmFloatToSen } from '@/lib/money'

// How any product doc — old or new — is read for selling and stock. Old docs
// (no sellUnits, no stock fields) are never migrated: they read as one
// default sell unit priced from the legacy `price` float, unmanaged.

export type Channel = 'online' | 'wholesale' | 'both'
export type StockStatus = 'in_stock' | 'low' | 'out'

export interface SellUnit {
  id: string
  /** e.g. "1 kg", "500 g pack", "25 kg bag" */
  label: string
  /** Base units consumed by one of these, in milli-units (0.5 kg = 500). */
  factorMilli: number
  /** Null = "Ask for price". */
  priceSen: number | null
  channel: Channel
}

export interface StockConfig {
  /** Stock engine applies only when true. Missing field = false. */
  managed: boolean
  baseUnit: string
  lowStockThresholdMilli: number
  trackExpiry: boolean
}

export const DEFAULT_LOW_STOCK_MILLI = 5 * MILLI
export const DEFAULT_UNIT_ID = 'default'

type Doc = Record<string, unknown> | undefined

function intOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) ? value : fallback
}

export function readStockConfig(data: Doc): StockConfig {
  const d = data ?? {}
  return {
    managed: d.managedStock === true,
    baseUnit: typeof d.baseUnit === 'string' && d.baseUnit ? d.baseUnit : 'pc',
    lowStockThresholdMilli: Math.max(0, intOr(d.lowStockThresholdMilli, DEFAULT_LOW_STOCK_MILLI)),
    trackExpiry: d.trackExpiry === true,
  }
}

export function normalizeSellUnit(raw: unknown): SellUnit | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const id = typeof r.id === 'string' && r.id ? r.id : null
  const label = typeof r.label === 'string' && r.label.trim() ? r.label.trim() : null
  const factorMilli = intOr(r.factorMilli, 0)
  const priceSen = r.priceSen === null || r.priceSen === undefined ? null : intOr(r.priceSen, -1)
  const channel: Channel = r.channel === 'wholesale' || r.channel === 'online' ? r.channel : 'both'
  if (!id || !label || factorMilli <= 0 || (priceSen !== null && priceSen < 0)) return null
  return { id, label, factorMilli, priceSen, channel }
}

/** The default sell unit an old product gets, derived from its legacy fields. */
export function legacyDefaultUnit(data: Doc): SellUnit {
  const d = data ?? {}
  const price = [d.price, d.Price, d.cost].find((v) => typeof v === 'number' && Number.isFinite(v))
  const baseUnit = typeof d.baseUnit === 'string' && d.baseUnit ? d.baseUnit : 'pc'
  return { id: DEFAULT_UNIT_ID, label: `1 ${baseUnit}`, factorMilli: MILLI, priceSen: rmFloatToSen(price), channel: 'both' }
}

/** Units stored on the public product doc (online or both). A product saved
 *  by the new editor always has the field (possibly empty, e.g. wholesale
 *  only); only an old product with no field at all gets the legacy default. */
export function readPublicSellUnits(data: Doc): SellUnit[] {
  if (!Array.isArray(data?.sellUnits)) return [legacyDefaultUnit(data)]
  return (data!.sellUnits as unknown[]).map(normalizeSellUnit).filter(Boolean) as SellUnit[]
}

/** All units: public ones plus wholesale-only ones from productPrivate/{id}. */
export function readAllSellUnits(data: Doc, privateData: Doc): SellUnit[] {
  const wholesale = Array.isArray(privateData?.wholesaleUnits)
    ? ((privateData!.wholesaleUnits as unknown[]).map(normalizeSellUnit).filter(Boolean) as SellUnit[])
    : []
  return [...readPublicSellUnits(data), ...wholesale.map((u) => ({ ...u, channel: 'wholesale' as const }))]
}

export function isOnline(unit: SellUnit) {
  return unit.channel === 'online' || unit.channel === 'both'
}

export function deriveStockStatus(availableMilli: number, lowThresholdMilli: number): StockStatus {
  if (availableMilli <= 0) return 'out'
  if (availableMilli <= lowThresholdMilli) return 'low'
  return 'in_stock'
}

/** What the shop may show: status only for managed products; otherwise the
 *  legacy manual inStock flag, exactly as before. Never a number. */
export function customerAvailability(data: Doc): { sellable: boolean; status: StockStatus | null } {
  const d = data ?? {}
  if (d.managedStock === true) {
    const status: StockStatus = d.stockStatus === 'low' || d.stockStatus === 'out' ? d.stockStatus : d.stockStatus === 'in_stock' ? 'in_stock' : 'out'
    return { sellable: status !== 'out', status }
  }
  return { sellable: d.inStock !== false, status: null }
}
