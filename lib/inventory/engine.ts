// The stock engine's arithmetic, pure: no Firestore, no clock. The server
// (lib/server/stock.ts) loads state inside a transaction, applies these
// operations, and writes the results plus one ledger movement per
// operation. All quantities are integer milli-units of the base unit.
//
// Invariants (checked by scripts/unit/engine.test.ts):
//   onHand   = sum of every movement's onHandDeltaMilli
//   reserved = sum of every movement's reservedDeltaMilli, and never < 0
//   if expiry is tracked: sum(batch.qtyMilli) = max(onHand, 0), batches never < 0
// onHand may go below zero only through an explicit oversell.

export type Reason =
  | 'restock'
  | 'sale'
  | 'oversold'
  | 'adjust'
  | 'reserve'
  | 'release'
  | 'expire'
  | 'damaged'
  | 'count'
  | 'void'

export interface Batch {
  id: string
  qtyMilli: number
  /** YYYY-MM-DD (Asia/Kuala_Lumpur), or null = no expiry set */
  expiryDate: string | null
  receivedAt: number
}

export interface ItemState {
  onHandMilli: number
  reservedMilli: number
  trackExpiry: boolean
  batches: Batch[]
}

export interface Allocation {
  batchId: string
  qtyMilli: number
}

export interface Movement {
  reason: Reason
  onHandDeltaMilli: number
  reservedDeltaMilli: number
  allocations: Allocation[]
  /** Batch created by this movement, if any. */
  newBatch?: Batch
}

export function availableMilli(s: ItemState) {
  return s.onHandMilli - s.reservedMilli
}

export function cloneState(s: ItemState): ItemState {
  return { ...s, batches: s.batches.map((b) => ({ ...b })) }
}

/** First-expiry-first-out: soonest expiry first, then "no expiry set",
 *  oldest received first within each. */
export function fefoOrder(batches: Batch[]): Batch[] {
  return [...batches]
    .filter((b) => b.qtyMilli > 0)
    .sort((a, b) => {
      if (a.expiryDate !== b.expiryDate) {
        if (a.expiryDate === null) return 1
        if (b.expiryDate === null) return -1
        return a.expiryDate < b.expiryDate ? -1 : 1
      }
      return a.receivedAt - b.receivedAt
    })
}

export function allocateFefo(batches: Batch[], needMilli: number): { allocations: Allocation[]; shortMilli: number } {
  const allocations: Allocation[] = []
  let remaining = needMilli
  for (const b of fefoOrder(batches)) {
    if (remaining <= 0) break
    const take = Math.min(b.qtyMilli, remaining)
    allocations.push({ batchId: b.id, qtyMilli: take })
    remaining -= take
  }
  return { allocations, shortMilli: Math.max(0, remaining) }
}

function assertPositive(q: number) {
  if (!Number.isInteger(q) || q <= 0) throw new Error(`quantity must be a positive integer of milli-units, got ${q}`)
}

export function reserve(s: ItemState, q: number): Movement {
  assertPositive(q)
  s.reservedMilli += q
  return { reason: 'reserve', onHandDeltaMilli: 0, reservedDeltaMilli: q, allocations: [] }
}

export function release(s: ItemState, q: number): Movement {
  assertPositive(q)
  const r = Math.min(q, s.reservedMilli)
  s.reservedMilli -= r
  return { reason: 'release', onHandDeltaMilli: 0, reservedDeltaMilli: -r, allocations: [] }
}

/** Takes stock out of onHand (sale, oversold, damaged, expire, count down).
 *  `fromReservedMilli`: how much of it was held for this (an order being
 *  collected), released in the same movement. */
export function deduct(s: ItemState, q: number, reason: Reason, fromReservedMilli = 0): Movement {
  assertPositive(q)
  const releaseQ = Math.min(fromReservedMilli, s.reservedMilli)
  s.reservedMilli -= releaseQ
  let allocations: Allocation[] = []
  if (s.trackExpiry) {
    const fromBatches = Math.min(q, Math.max(0, s.onHandMilli))
    allocations = allocateFefo(s.batches, fromBatches).allocations
    for (const a of allocations) s.batches.find((b) => b.id === a.batchId)!.qtyMilli -= a.qtyMilli
  }
  s.onHandMilli -= q
  return { reason, onHandDeltaMilli: -q, reservedDeltaMilli: -releaseQ, allocations }
}

/**
 * Puts stock into onHand (restock, count up, a voided sale coming back).
 * With expiry tracking, only the part that brings onHand above zero lands
 * in batches (stock that covers an earlier oversell was never on a shelf).
 * `restore`: put it back into the exact batches it came from (void), then
 * any remainder into `batch` or a "no expiry set" batch.
 */
export function add(
  s: ItemState,
  q: number,
  reason: Reason,
  opts: { batch?: { id: string; expiryDate: string | null; receivedAt: number }; restore?: Allocation[] } = {}
): Movement {
  assertPositive(q)
  const before = Math.max(0, s.onHandMilli)
  s.onHandMilli += q
  const allocations: Allocation[] = []
  let newBatch: Batch | undefined
  if (s.trackExpiry) {
    let toBatches = Math.max(0, s.onHandMilli) - before
    for (const r of opts.restore ?? []) {
      if (toBatches <= 0) break
      const target = s.batches.find((b) => b.id === r.batchId)
      if (!target) continue
      const put = Math.min(r.qtyMilli, toBatches)
      target.qtyMilli += put
      allocations.push({ batchId: target.id, qtyMilli: put })
      toBatches -= put
    }
    if (toBatches > 0) {
      const spec = opts.batch ?? { id: `nb-${s.batches.length}-${q}`, expiryDate: null, receivedAt: 0 }
      newBatch = { id: spec.id, qtyMilli: toBatches, expiryDate: spec.expiryDate, receivedAt: spec.receivedAt }
      s.batches.push(newBatch)
      allocations.push({ batchId: newBatch.id, qtyMilli: toBatches })
    }
  }
  return { reason, onHandDeltaMilli: q, reservedDeltaMilli: 0, allocations, newBatch }
}

/** Sets onHand to what was physically counted. Returns null if unchanged. */
export function count(
  s: ItemState,
  countedMilli: number,
  opts: { batch?: { id: string; expiryDate: string | null; receivedAt: number } } = {}
): Movement | null {
  if (!Number.isInteger(countedMilli) || countedMilli < 0) throw new Error('count must be a non-negative integer')
  const delta = countedMilli - s.onHandMilli
  if (delta === 0) return null
  return delta > 0 ? add(s, delta, 'count', opts) : deduct(s, -delta, 'count')
}

export function batchSum(s: ItemState) {
  return s.batches.reduce((n, b) => n + b.qtyMilli, 0)
}

/** Empty list = consistent. */
export function checkInvariants(s: ItemState, movements: Pick<Movement, 'onHandDeltaMilli' | 'reservedDeltaMilli'>[] | null): string[] {
  const problems: string[] = []
  if (s.reservedMilli < 0) problems.push(`reserved is negative (${s.reservedMilli})`)
  if (s.trackExpiry) {
    if (s.batches.some((b) => b.qtyMilli < 0)) problems.push('a batch is negative')
    const sum = batchSum(s)
    if (sum !== Math.max(0, s.onHandMilli)) problems.push(`batches sum to ${sum} but on hand is ${s.onHandMilli}`)
  }
  if (movements) {
    const onHand = movements.reduce((n, m) => n + m.onHandDeltaMilli, 0)
    const reserved = movements.reduce((n, m) => n + m.reservedDeltaMilli, 0)
    if (onHand !== s.onHandMilli) problems.push(`ledger says on hand ${onHand}, inventory says ${s.onHandMilli}`)
    if (reserved !== s.reservedMilli) problems.push(`ledger says reserved ${reserved}, inventory says ${s.reservedMilli}`)
  }
  return problems
}
