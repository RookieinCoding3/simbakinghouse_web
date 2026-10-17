import crypto from 'crypto'
import { FieldValue, Timestamp, type DocumentReference, type Firestore } from 'firebase-admin/firestore'
import { allocateFefo, type Batch as FefoBatch } from '@/lib/inventory/engine'

// The SBH Inventory stock system, written from the website (server only,
// Admin SDK). ONE source of truth with the iPad app: the same collections
// and document shapes as sbh-inventory lib/data/stock_writer.dart —
// stockMovements (append-only ledger), batches (qty per lot, FEFO),
// stockLevels (on hand + held per product and place), receipts / wastage /
// stockTakes (operation records), batchCosts / productCosts (owner only).
// Quantities are integer milli-units (1000 = one base unit); money is sen.

export const STOREROOM = 'storeroom'

export type MovementType =
  | 'receive'
  | 'count_adjust'
  | 'wastage'
  | 'opening'
  | 'online_reserve'
  | 'online_sale'
  | 'online_release'

export interface InvBatch {
  id: string
  productId: string
  locationId: string
  qtyMilli: number
  receivedDate: string | null // YYYY-MM-DD
  expiryDate: string | null // YYYY-MM-DD
  supplierName: string | null
}

export interface BatchSeed {
  id: string
  productId: string
  locationId: string
  receivedDate: string
  expiryDate: string | null
  supplierName: string | null
  note: string | null
  unitCostSen: number | null
}

export interface LedgerLine {
  id: string
  type: MovementType
  productId: string
  locationId: string
  batchId: string | null
  qtyDeltaMilli: number
  reservedDeltaMilli: number
  reason: string | null
  newBatch?: BatchSeed
}

export interface InvOp {
  id: string
  refType: 'receipt' | 'wastage' | 'stockTake' | 'order'
  /** Operation record (receipts / wastage / stockTakes); none for orders. */
  parentCollection: 'receipts' | 'wastage' | 'stockTakes' | null
  parentData: Record<string, unknown>
  lines: LedgerLine[]
  isCount: boolean
  /** productCosts/{id} updates (latest cost). */
  productCosts: Record<string, number>
  /** Extra product doc fields (e.g. counted: openingCount done). */
  productUpdates: Record<string, Record<string, unknown>>
}

/** The `inv` field on an order: what the stock system holds for it. */
export interface InvHold {
  state: 'reserved' | 'collected' | 'released'
  locationId: string
  lines: { productId: string; qtyMilli: number }[]
}

export const newId = () => crypto.randomUUID()

const line = (l: Omit<LedgerLine, 'id' | 'batchId' | 'reason' | 'reservedDeltaMilli'> & Partial<LedgerLine>): LedgerLine => ({
  id: newId(),
  batchId: l.newBatch?.id ?? l.batchId ?? null,
  reason: l.reason ?? null,
  reservedDeltaMilli: l.reservedDeltaMilli ?? 0,
  ...l,
})

const toFefo = (b: InvBatch): FefoBatch => ({
  id: b.id,
  qtyMilli: b.qtyMilli,
  expiryDate: b.expiryDate,
  receivedAt: b.receivedDate ? Date.parse(b.receivedDate) : 0,
})

// ------------------------------------------------------------- receive

export interface ReceiveInput {
  productId: string
  qtyMilli: number
  unitCostSen: number | null
  supplierName: string | null
  expiryDate: string | null
  receivedDate: string
  locationId?: string
  note?: string | null
}

/** Receive Batch: a new lot (with expiry, supplier, cost) + its ledger entry. */
export function receiveOp(r: ReceiveInput): InvOp {
  if (!Number.isInteger(r.qtyMilli) || r.qtyMilli <= 0) throw new Error('quantity must be positive')
  const loc = r.locationId ?? STOREROOM
  const seed: BatchSeed = {
    id: newId(),
    productId: r.productId,
    locationId: loc,
    receivedDate: r.receivedDate,
    expiryDate: r.expiryDate,
    supplierName: r.supplierName,
    note: r.note ?? null,
    unitCostSen: r.unitCostSen,
  }
  return {
    id: newId(),
    refType: 'receipt',
    parentCollection: 'receipts',
    parentData: {
      supplierName: r.supplierName,
      note: r.note ?? null,
      receivedDate: r.receivedDate,
      lines: [{ productId: r.productId, qtyMilli: r.qtyMilli, locationId: loc }],
      source: 'web',
    },
    lines: [line({ type: 'receive', productId: r.productId, locationId: loc, qtyDeltaMilli: r.qtyMilli, newBatch: seed })],
    isCount: false,
    productCosts: r.unitCostSen === null ? {} : { [r.productId]: r.unitCostSen },
    productUpdates: {},
  }
}

// ------------------------------------------------------------- adjust

/** Damaged / spilled / expired: taken off one chosen batch. */
export function wastageOp(batch: InvBatch, qtyMilli: number, reason: string): InvOp {
  if (!Number.isInteger(qtyMilli) || qtyMilli <= 0) throw new Error('quantity must be positive')
  return {
    id: newId(),
    refType: 'wastage',
    parentCollection: 'wastage',
    parentData: { productId: batch.productId, batchId: batch.id, qtyMilli, reason, source: 'web' },
    lines: [
      line({ type: 'wastage', productId: batch.productId, locationId: batch.locationId, batchId: batch.id, qtyDeltaMilli: -qtyMilli, reason }),
    ],
    isCount: false,
    productCosts: {},
    productUpdates: {},
  }
}

/** Manual recount at one place: the difference becomes count_adjust entries
 *  (down: FEFO across batches; up: into the newest batch, or a new one). */
export function recountOp(args: {
  productId: string
  locationId: string
  expectedMilli: number
  countedMilli: number
  batches: InvBatch[]
  today: string
  reason?: string | null
}): InvOp {
  const { productId, locationId, expectedMilli, countedMilli, batches, today } = args
  if (!Number.isInteger(countedMilli) || countedMilli < 0) throw new Error('count must be 0 or more')
  const diff = countedMilli - expectedMilli
  const here = batches.filter((b) => b.locationId === locationId && b.productId === productId)
  const lines: LedgerLine[] = []
  if (diff < 0) {
    const alloc = allocateFefo(here.map(toFefo), -diff)
    for (const a of alloc.allocations) {
      lines.push(line({ type: 'count_adjust', productId, locationId, batchId: a.batchId, qtyDeltaMilli: -a.qtyMilli, reason: args.reason ?? null }))
    }
    if (alloc.shortMilli > 0) lines.push(line({ type: 'count_adjust', productId, locationId, qtyDeltaMilli: -alloc.shortMilli, reason: args.reason ?? null }))
  } else if (diff > 0) {
    // Newest received batch, like the iPad (fefoOrder last).
    const newest = [...here].filter((b) => b.qtyMilli >= 0).sort((a, b) => (a.receivedDate ?? '').localeCompare(b.receivedDate ?? '')).pop()
    lines.push(
      line({
        type: 'count_adjust',
        productId,
        locationId,
        batchId: newest?.id ?? null,
        qtyDeltaMilli: diff,
        reason: args.reason ?? null,
        newBatch: newest
          ? undefined
          : { id: newId(), productId, locationId, receivedDate: today, expiryDate: null, supplierName: null, note: 'count', unitCostSen: null },
      }),
    )
  }
  return {
    id: newId(),
    refType: 'stockTake',
    parentCollection: 'stockTakes',
    parentData: {
      mode: 'spot',
      source: 'web',
      status: 'completed',
      locationId,
      lines: { [productId]: { productId, expectedQtyMilli: expectedMilli, countedQtyMilli: countedMilli, diffMilli: diff, reason: args.reason ?? null } },
    },
    lines,
    isCount: true,
    productCosts: {},
    // A count is what the website's availability needs (opening count done).
    productUpdates: { [productId]: { lastCountedAt: Timestamp.now(), openingCount: { done: true, doneAt: Timestamp.now() } } },
  }
}

// ------------------------------------------------------------- orders

/** Confirm: hold the stock (online_reserve: held only, on hand unchanged). */
export function confirmOrderOp(orderLines: { productId: string; qtyMilli: number }[], locationId = STOREROOM): { op: InvOp; hold: InvHold } {
  const byProduct = new Map<string, number>()
  for (const l of orderLines) if (l.qtyMilli > 0) byProduct.set(l.productId, (byProduct.get(l.productId) ?? 0) + l.qtyMilli)
  const holds = [...byProduct].map(([productId, qtyMilli]) => ({ productId, qtyMilli }))
  return {
    op: {
      id: newId(),
      refType: 'order',
      parentCollection: null,
      parentData: {},
      lines: holds.map((h) => line({ type: 'online_reserve', productId: h.productId, locationId, qtyDeltaMilli: 0, reservedDeltaMilli: h.qtyMilli })),
      isCount: false,
      productCosts: {},
      productUpdates: {},
    },
    hold: { state: 'reserved', locationId, lines: holds },
  }
}

/** Collected: online_sale takes the stock off the soonest-expiring batches
 *  first and lets go of the hold in the same entries (iPad collectOrderOp). */
export function collectOrderOp(hold: InvHold | null, orderLines: { productId: string; qtyMilli: number }[], batchesByProduct: Map<string, InvBatch[]>): { op: InvOp; hold: InvHold } {
  const loc = hold?.locationId ?? STOREROOM
  const holdLines = hold?.lines ?? orderLines
  const reserved = hold?.state === 'reserved'
  const lines: LedgerLine[] = []
  for (const h of holdLines) {
    const here = (batchesByProduct.get(h.productId) ?? []).filter((b) => b.locationId === loc)
    const alloc = allocateFefo(here.map(toFefo), h.qtyMilli)
    let releaseLeft = reserved ? h.qtyMilli : 0
    for (const a of alloc.allocations) {
      const rel = Math.min(releaseLeft, a.qtyMilli)
      releaseLeft -= rel
      lines.push(line({ type: 'online_sale', productId: h.productId, locationId: loc, batchId: a.batchId, qtyDeltaMilli: -a.qtyMilli, reservedDeltaMilli: -rel }))
    }
    if (alloc.shortMilli > 0 || releaseLeft > 0) {
      lines.push(line({ type: 'online_sale', productId: h.productId, locationId: loc, qtyDeltaMilli: -alloc.shortMilli, reservedDeltaMilli: -releaseLeft }))
    }
  }
  return {
    op: { id: newId(), refType: 'order', parentCollection: null, parentData: {}, lines, isCount: false, productCosts: {}, productUpdates: {} },
    hold: { state: 'collected', locationId: loc, lines: holdLines },
  }
}

/** Cancel: let go of a hold (online_release). */
export function releaseOrderOp(hold: InvHold): { op: InvOp; hold: InvHold } {
  return {
    op: {
      id: newId(),
      refType: 'order',
      parentCollection: null,
      parentData: {},
      lines:
        hold.state === 'reserved'
          ? hold.lines.map((h) => line({ type: 'online_release', productId: h.productId, locationId: hold.locationId, qtyDeltaMilli: 0, reservedDeltaMilli: -h.qtyMilli }))
          : [],
      isCount: false,
      productCosts: {},
      productUpdates: {},
    },
    hold: hold.state === 'reserved' ? { ...hold, state: 'released' } : hold,
  }
}

export function readHold(v: unknown): InvHold | null {
  if (!v || typeof v !== 'object') return null
  const m = v as Record<string, unknown>
  const lines = Array.isArray(m.lines)
    ? m.lines
        .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
        .map((x) => ({ productId: String(x.productId ?? ''), qtyMilli: Number.isInteger(x.qtyMilli) ? (x.qtyMilli as number) : 0 }))
        .filter((x) => x.productId && x.qtyMilli > 0)
    : []
  const state = m.state === 'collected' || m.state === 'released' ? m.state : 'reserved'
  return { state, locationId: typeof m.locationId === 'string' ? m.locationId : STOREROOM, lines }
}

export function readBatch(id: string, d: Record<string, unknown>): InvBatch {
  return {
    id,
    productId: String(d.productId ?? ''),
    locationId: typeof d.locationId === 'string' ? d.locationId : STOREROOM,
    qtyMilli: typeof d.qtyMilli === 'number' ? d.qtyMilli : 0,
    receivedDate: typeof d.receivedDate === 'string' ? d.receivedDate : null,
    expiryDate: typeof d.expiryDate === 'string' ? d.expiryDate : null,
    supplierName: typeof d.supplierName === 'string' ? d.supplierName : null,
  }
}

// ------------------------------------------------------------- writer

interface Setter {
  set(ref: DocumentReference, data: Record<string, unknown>, options?: { merge: boolean }): unknown
}

/** Writes an InvOp exactly like the iPad's StockWriter.build (one batch or
 *  transaction): parent record, ledger docs, new batches (+ costs), batch
 *  increments, stockLevels increments, latest costs. */
export function writeInvOp(db: Firestore, w: Setter, op: InvOp, actor: { uid: string }, deviceId = 'web-admin') {
  const now = Timestamp.now()
  const server = FieldValue.serverTimestamp()
  const stamp = { createdBy: actor.uid, updatedBy: actor.uid, createdAt: server, updatedAt: server }

  if (op.parentCollection) {
    w.set(db.collection(op.parentCollection).doc(op.id), {
      ...op.parentData,
      ...stamp,
      userId: actor.uid,
      deviceId,
      clientTime: now,
      lines: op.parentData.lines ?? [],
      movementIds: op.lines.map((l) => l.id),
      ledger: op.lines.map((l) => ({
        id: l.id,
        type: l.type,
        productId: l.productId,
        locationId: l.locationId,
        batchId: l.batchId,
        qtyDeltaMilli: l.qtyDeltaMilli,
        reservedDeltaMilli: l.reservedDeltaMilli,
      })),
    })
  }

  const batchDeltas = new Map<string, number>()
  const levelDeltas = new Map<string, { productId: string; locationId: string; onHand: number; reserved: number }>()
  for (const l of op.lines) {
    w.set(db.collection('stockMovements').doc(l.id), {
      type: l.type,
      productId: l.productId,
      batchId: l.batchId,
      locationId: l.locationId,
      qtyDeltaMilli: l.qtyDeltaMilli,
      reservedDeltaMilli: l.reservedDeltaMilli,
      reason: l.reason,
      refType: op.refType,
      refId: op.id,
      reversesId: null,
      userId: actor.uid,
      deviceId,
      clientTime: now,
      serverTime: server,
      createdAt: server,
      createdBy: actor.uid,
    })
    const seed = l.newBatch
    if (seed) {
      w.set(db.collection('batches').doc(seed.id), {
        productId: seed.productId,
        locationId: seed.locationId,
        qtyMilli: l.qtyDeltaMilli,
        receivedDate: seed.receivedDate,
        expiryDate: seed.expiryDate,
        expirySource: seed.expiryDate ? 'manual' : null,
        sourceBatchId: null,
        supplierName: seed.supplierName,
        note: seed.note,
        clientTime: now,
        ...stamp,
      })
      if (seed.unitCostSen !== null) {
        w.set(db.collection('batchCosts').doc(seed.id), { productId: seed.productId, unitCostSen: seed.unitCostSen, ...stamp })
      }
    } else if (l.batchId && l.qtyDeltaMilli !== 0) {
      batchDeltas.set(l.batchId, (batchDeltas.get(l.batchId) ?? 0) + l.qtyDeltaMilli)
    }
    if (l.qtyDeltaMilli !== 0 || l.reservedDeltaMilli !== 0 || op.isCount) {
      const key = `${l.productId}_${l.locationId}`
      const prev = levelDeltas.get(key)
      levelDeltas.set(key, {
        productId: l.productId,
        locationId: l.locationId,
        onHand: (prev?.onHand ?? 0) + l.qtyDeltaMilli,
        reserved: (prev?.reserved ?? 0) + l.reservedDeltaMilli,
      })
    }
  }
  // A count that matched writes no ledger line, but still stamps the level.
  if (op.isCount && op.lines.length === 0) {
    const pc = op.parentData.lines as Record<string, { productId: string }> | undefined
    const productId = pc ? Object.keys(pc)[0] : undefined
    const loc = op.parentData.locationId as string | undefined
    if (productId && loc) levelDeltas.set(`${productId}_${loc}`, { productId, locationId: loc, onHand: 0, reserved: 0 })
  }
  for (const [id, delta] of batchDeltas) {
    w.set(db.collection('batches').doc(id), { qtyMilli: FieldValue.increment(delta), updatedAt: server }, { merge: true })
  }
  for (const [key, d] of levelDeltas) {
    w.set(
      db.collection('stockLevels').doc(key),
      {
        productId: d.productId,
        locationId: d.locationId,
        onHandMilli: FieldValue.increment(d.onHand),
        reservedMilli: FieldValue.increment(d.reserved),
        lastMovementAt: now,
        ...(op.isCount ? { lastCountedAt: now } : {}),
        updatedAt: server,
      },
      { merge: true },
    )
  }
  for (const [productId, cost] of Object.entries(op.productCosts)) {
    w.set(db.collection('productCosts').doc(productId), { costPerUnitSen: cost, updatedAt: server }, { merge: true })
  }
  for (const [productId, data] of Object.entries(op.productUpdates)) {
    w.set(db.collection('products').doc(productId), data, { merge: true })
  }
}
