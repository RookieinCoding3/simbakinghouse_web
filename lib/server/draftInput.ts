import { Refused } from './http'

// "Complete details" for products quick-added on the SBH Inventory iPad
// (status 'draft'). Same fields as the iPad's Complete details screen.

export const UNITS = ['pack', 'bag', 'kg', 'pc', 'box'] as const
export const KINDS = ['standard', 'bulk', 'repack'] as const

export interface DraftCompletion {
  name: string
  nameZh: string
  categoryId: string
  unitLabel: string
  kind: (typeof KINDS)[number]
  repackSourceProductId: string | null
  repackYield: number | null
  sellPriceSen: number | null
  costSen: number | null
}

function sen(v: unknown, label: string): number | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 10_000_000) throw new Refused(`${label} is not a valid amount.`, 400)
  return v
}

/** Validates the form. Prices arrive in sen (integers). */
export function parseDraftCompletion(b: Record<string, unknown>): DraftCompletion {
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const nameZh = str(b.nameZh, 120)
  // The website shows `name`: with only a Chinese name, use it there too.
  const name = str(b.name, 120) || nameZh
  if (!name) throw new Refused('Enter a name (English or Chinese).', 400)
  const categoryId = str(b.categoryId, 100)
  if (!categoryId) throw new Refused('Choose a category.', 400)
  const unitLabel = str(b.unitLabel, 20) || 'pack'
  const kind = (KINDS as readonly string[]).includes(b.kind as string) ? (b.kind as DraftCompletion['kind']) : 'standard'
  let repackSourceProductId: string | null = null
  let repackYield: number | null = null
  if (kind === 'repack') {
    repackSourceProductId = str(b.repackSourceProductId, 100) || null
    if (!repackSourceProductId) throw new Refused('Choose the big bag it is made from.', 400)
    const y = b.repackYield
    if (typeof y !== 'number' || !Number.isInteger(y) || y <= 0 || y > 10000) throw new Refused('Enter how many packs one bag makes.', 400)
    repackYield = y
  }
  return {
    name,
    nameZh,
    categoryId,
    unitLabel,
    kind,
    repackSourceProductId,
    repackYield,
    sellPriceSen: sen(b.sellPriceSen, 'Sell price'),
    costSen: sen(b.costSen, 'Cost'),
  }
}

/** What blocks completing a draft (same rule as the iPad): no sell price, or
 *  nothing counted on the shelf. */
export function draftProblems(sellPriceSen: number | null, onHandMilli: number): { noPrice: boolean; noQty: boolean } {
  return { noPrice: sellPriceSen === null || sellPriceSen <= 0, noQty: onHandMilli <= 0 }
}
