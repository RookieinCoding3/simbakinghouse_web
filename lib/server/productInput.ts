import crypto from 'crypto'
import { BASE_UNITS } from '@/lib/inventory/units'
import type { SellUnit, Channel } from '@/lib/inventory/catalog'
import { Refused } from './http'

export interface ProductInput {
  name: string
  description: string
  category: string
  imageUrl: string
  inStock: boolean
  featured: boolean
  mentorNote: string
  baseUnit: string
  lowStockThresholdMilli: number
  trackExpiry: boolean
  barcodes: string[]
  units: SellUnit[]
}

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

/** Validates the editor's payload. Messages are shown to Sim as-is. */
export function parseProductInput(b: Record<string, unknown>): ProductInput {
  const name = str(b.name, 120)
  if (!name) throw new Refused('Enter a name.', 400)
  const category = str(b.category, 60)
  if (!category) throw new Refused('Choose a category.', 400)
  const baseUnit = str(b.baseUnit, 12) || 'pc'
  if (!(BASE_UNITS as readonly string[]).includes(baseUnit)) throw new Refused('Choose a unit from the list.', 400)
  const threshold = b.lowStockThresholdMilli
  if (typeof threshold !== 'number' || !Number.isInteger(threshold) || threshold < 0 || threshold > 1e9) {
    throw new Refused('Enter a low-stock level (0 or more).', 400)
  }
  const rawUnits = Array.isArray(b.sellUnits) ? b.sellUnits : []
  if (rawUnits.length === 0) throw new Refused('Add at least one way to sell this product.', 400)
  if (rawUnits.length > 12) throw new Refused('Too many sell units (12 at most).', 400)
  const units: SellUnit[] = []
  for (const raw of rawUnits) {
    const r = (raw ?? {}) as Record<string, unknown>
    const label = str(r.label, 40)
    if (!label) throw new Refused('Every sell unit needs a name, like "1 kg" or "25 kg bag".', 400)
    const factorMilli = r.factorMilli
    if (typeof factorMilli !== 'number' || !Number.isInteger(factorMilli) || factorMilli <= 0) {
      throw new Refused(`"${label}": enter how many ${baseUnit} it uses (more than 0).`, 400)
    }
    const priceSen = r.priceSen === null || r.priceSen === undefined ? null : r.priceSen
    if (priceSen !== null && (typeof priceSen !== 'number' || !Number.isInteger(priceSen) || priceSen < 0 || priceSen > 10_000_000)) {
      throw new Refused(`"${label}": enter a valid price.`, 400)
    }
    const channel: Channel = r.channel === 'online' || r.channel === 'wholesale' ? r.channel : 'both'
    const id = typeof r.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(r.id) ? r.id : `u${crypto.randomBytes(4).toString('hex')}`
    if (units.some((u) => u.id === id)) throw new Refused('Two sell units ended up with the same id. Remove one and add it again.', 400)
    if (units.some((u) => u.label.toLowerCase() === label.toLowerCase())) throw new Refused(`There are two sell units called "${label}".`, 400)
    units.push({ id, label, factorMilli, priceSen: priceSen as number | null, channel })
  }
  const barcodes = Array.isArray(b.barcodes)
    ? [...new Set(b.barcodes.map((c) => str(c, 64)).filter(Boolean))]
    : []
  if (barcodes.some((c) => !/^[A-Za-z0-9-]{4,64}$/.test(c))) throw new Refused('Barcodes may only contain letters, digits and dashes.', 400)
  return {
    name,
    description: str(b.description, 2000),
    category,
    imageUrl: str(b.imageUrl, 1000),
    inStock: b.inStock !== false,
    featured: b.featured === true,
    mentorNote: str(b.mentorNote, 500),
    baseUnit,
    lowStockThresholdMilli: threshold,
    trackExpiry: b.trackExpiry === true,
    barcodes,
    units,
  }
}

/** What goes on the public product doc vs the admin-only private doc. */
export function splitUnits(units: SellUnit[]) {
  const publicUnits = units.filter((u) => u.channel !== 'wholesale')
  const wholesaleUnits = units.filter((u) => u.channel === 'wholesale')
  const legacyPriceSen = publicUnits.find((u) => u.priceSen !== null)?.priceSen ?? null
  return { publicUnits, wholesaleUnits, legacyPriceSen }
}
