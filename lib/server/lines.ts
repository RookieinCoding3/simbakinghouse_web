import type { DocumentSnapshot } from 'firebase-admin/firestore'
import { readAllSellUnits, readPublicSellUnits, readStockConfig, DEFAULT_UNIT_ID, isOnline, type SellUnit } from '@/lib/inventory/catalog'

export interface LineRequest {
  productId: string
  sellUnitId?: string | null
  qty: number
}

export interface ResolvedLine {
  productId: string
  name: string
  unit: SellUnit
  qty: number
  baseQtyMilli: number
  unitPriceSen: number | null
  lineTotalSen: number | null
  managed: boolean
  baseUnit: string
}

export class LineError extends Error {
  status: number
  productId?: string
  constructor(message: string, status = 400, productId?: string) {
    super(message)
    this.status = status
    this.productId = productId
  }
}

function productName(d: Record<string, unknown>): string {
  const n = [d.name, d.title, d.productName, d.Name].find((v) => typeof v === 'string' && v)
  return (n as string) ?? 'Product'
}

/**
 * Prices and sizes each requested line from the product docs — the client's
 * own prices are never read. `online`: only units sold online; wholesale-only
 * units are refused. `walkin`: every unit, including wholesale (needs the
 * private docs). A request without sellUnitId means the product's first
 * unit — what every cart saved before sell units existed contains.
 */
export function resolveLines(
  requests: LineRequest[],
  products: Map<string, DocumentSnapshot>,
  privates: Map<string, DocumentSnapshot> | null,
  channel: 'online' | 'walkin'
): ResolvedLine[] {
  return requests.map((r) => {
    const snap = products.get(r.productId)
    const data = snap?.exists ? (snap.data() as Record<string, unknown>) : undefined
    if (!data || data.isActive === false || data.isDeleted === true) {
      throw new LineError('One of the items in your cart is no longer available — please refresh and try again', 400, r.productId)
    }
    const name = productName(data)
    const units =
      channel === 'walkin'
        ? readAllSellUnits(data, privates?.get(r.productId)?.data())
        : readPublicSellUnits(data).filter(isOnline)
    const unit = r.sellUnitId ? units.find((u) => u.id === r.sellUnitId) : units.find((u) => u.id === DEFAULT_UNIT_ID) ?? units[0]
    if (!unit) {
      throw new LineError(
        channel === 'online' ? `${name}: that size is only sold in the shop. Ask us on WhatsApp.` : `${name}: that size no longer exists.`,
        400,
        r.productId
      )
    }
    const config = readStockConfig(data)
    const unitPriceSen = unit.priceSen
    return {
      productId: r.productId,
      name,
      unit,
      qty: r.qty,
      baseQtyMilli: r.qty * unit.factorMilli,
      unitPriceSen,
      lineTotalSen: unitPriceSen === null ? null : unitPriceSen * r.qty,
      managed: config.managed,
      baseUnit: config.baseUnit,
    }
  })
}

/** Total needed per product, in milli-units of its base unit. */
export function neededPerProduct(lines: ResolvedLine[]): Map<string, number> {
  const need = new Map<string, number>()
  for (const l of lines) need.set(l.productId, (need.get(l.productId) ?? 0) + l.baseQtyMilli)
  return need
}
