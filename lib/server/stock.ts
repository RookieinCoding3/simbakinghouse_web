import { FieldValue, type DocumentReference, type Transaction } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'
import { readStockConfig, deriveStockStatus, type StockConfig, type StockStatus } from '@/lib/inventory/catalog'
import { availableMilli, type Batch, type ItemState, type Movement } from '@/lib/inventory/engine'

export const SHOP_ID = 'sbh'

export interface StockActor {
  uid: string
  email: string | null
}

export interface StockItem {
  productId: string
  productRef: DocumentReference
  product: Record<string, unknown> | undefined
  config: StockConfig
  invRef: DocumentReference
  invExists: boolean
  state: ItemState
  movements: { movement: Movement; meta: MovementMeta }[]
  touched: boolean
}

export interface MovementMeta {
  orderId?: string
  saleId?: string
  opId?: string
  note?: string
}

/**
 * Everything a stock change needs, inside ONE Firestore transaction:
 * product docs, inventory docs and (for expiry-tracked products) batches
 * are read first; engine operations then run in memory; commit() writes
 * the new inventory totals, one ledger movement per operation, batch
 * changes, and the product's public stockStatus — all or nothing.
 */
export class StockSession {
  readonly items = new Map<string, StockItem>()
  private readonly db = getAdminDb()

  constructor(private readonly tx: Transaction, private readonly actor: StockActor) {}

  /** Reads only — call before any tx writes (Firestore's rule for transactions). */
  async load(productIds: string[]) {
    const ids = [...new Set(productIds)].filter((id) => !this.items.has(id))
    const productRefs = ids.map((id) => this.db.collection('products').doc(id))
    const invRefs = ids.map((id) => this.db.collection('inventory').doc(id))
    const snaps = ids.length ? await this.tx.getAll(...productRefs, ...invRefs) : []
    for (const [i, id] of ids.entries()) {
      const product = snaps[i].exists ? snaps[i].data() : undefined
      const inv = snaps[ids.length + i]
      const config = readStockConfig(product)
      let batches: Batch[] = []
      if (config.trackExpiry && inv.exists) {
        const bs = await this.tx.get(this.db.collection('batches').where('productId', '==', id))
        batches = bs.docs.map((d) => {
          const b = d.data()
          return { id: d.id, qtyMilli: Number(b.qtyMilli) || 0, expiryDate: typeof b.expiryDate === 'string' ? b.expiryDate : null, receivedAt: Number(b.receivedAt) || 0 }
        })
      }
      const invData = inv.data() ?? {}
      this.items.set(id, {
        productId: id,
        productRef: productRefs[i],
        product,
        config,
        invRef: invRefs[i],
        invExists: inv.exists,
        state: {
          onHandMilli: Number(invData.onHandMilli) || 0,
          reservedMilli: Number(invData.reservedMilli) || 0,
          trackExpiry: config.trackExpiry,
          batches,
        },
        movements: [],
        touched: false,
      })
    }
  }

  item(productId: string): StockItem {
    const it = this.items.get(productId)
    if (!it) throw new Error(`stock session: ${productId} not loaded`)
    return it
  }

  available(productId: string) {
    return availableMilli(this.item(productId).state)
  }

  newBatchId() {
    return this.db.collection('batches').doc().id
  }

  /** Run an engine operation against a loaded product's state. */
  apply(productId: string, op: (s: ItemState) => Movement | null, meta: MovementMeta = {}): Movement | null {
    const it = this.item(productId)
    const m = op(it.state)
    if (m) {
      it.movements.push({ movement: m, meta })
      it.touched = true
    }
    return m
  }

  /** Writes everything touched. Returns the new public status per product. */
  commit(extra: { lastCountedAt?: boolean } = {}): Map<string, StockStatus | null> {
    const statuses = new Map<string, StockStatus | null>()
    for (const it of this.items.values()) {
      if (!it.touched) continue
      const { state } = it
      this.tx.set(
        it.invRef,
        {
          shopId: SHOP_ID,
          productId: it.productId,
          onHandMilli: state.onHandMilli,
          reservedMilli: state.reservedMilli,
          updatedAt: FieldValue.serverTimestamp(),
          ...(extra.lastCountedAt && { lastCountedAt: FieldValue.serverTimestamp() }),
        },
        { merge: true }
      )
      let onHandAfter = state.onHandMilli - it.movements.reduce((n, x) => n + x.movement.onHandDeltaMilli, 0)
      let reservedAfter = state.reservedMilli - it.movements.reduce((n, x) => n + x.movement.reservedDeltaMilli, 0)
      for (const { movement, meta } of it.movements) {
        onHandAfter += movement.onHandDeltaMilli
        reservedAfter += movement.reservedDeltaMilli
        this.tx.set(this.db.collection('stockMovements').doc(), {
          shopId: SHOP_ID,
          productId: it.productId,
          reason: movement.reason,
          onHandDeltaMilli: movement.onHandDeltaMilli,
          reservedDeltaMilli: movement.reservedDeltaMilli,
          onHandAfterMilli: onHandAfter,
          reservedAfterMilli: reservedAfter,
          allocations: movement.allocations,
          ...(movement.newBatch && { batchId: movement.newBatch.id }),
          ...(meta.orderId && { orderId: meta.orderId }),
          ...(meta.saleId && { saleId: meta.saleId }),
          ...(meta.opId && { opId: meta.opId }),
          note: meta.note ?? '',
          byUid: this.actor.uid,
          byEmail: this.actor.email,
          at: FieldValue.serverTimestamp(),
        })
      }
      if (state.trackExpiry) {
        for (const b of state.batches) {
          this.tx.set(
            this.db.collection('batches').doc(b.id),
            { shopId: SHOP_ID, productId: it.productId, qtyMilli: b.qtyMilli, expiryDate: b.expiryDate, receivedAt: b.receivedAt },
            { merge: true }
          )
        }
      }
      if (it.config.managed) {
        const status = deriveStockStatus(availableMilli(state), it.config.lowStockThresholdMilli)
        statuses.set(it.productId, status)
        if (it.product?.stockStatus !== status) this.tx.update(it.productRef, { stockStatus: status })
      } else {
        statuses.set(it.productId, null)
      }
    }
    return statuses
  }
}

/** Idempotency key for a one-off admin action (a double tap sends the same
 *  opId). Read it before any writes; claim it in the same transaction. */
export async function opAlreadyDone(tx: Transaction, opId: string): Promise<boolean> {
  const snap = await tx.get(getAdminDb().collection('stockOps').doc(opId))
  return snap.exists
}
export function claimOp(tx: Transaction, opId: string, actor: StockActor, kind: string) {
  tx.set(getAdminDb().collection('stockOps').doc(opId), { shopId: SHOP_ID, kind, byUid: actor.uid, at: FieldValue.serverTimestamp() })
}
