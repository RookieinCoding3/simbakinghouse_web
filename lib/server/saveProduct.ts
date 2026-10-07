import { FieldValue, type Transaction } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'
import { readStockConfig, deriveStockStatus } from '@/lib/inventory/catalog'
import type { ProductInput } from './productInput'
import { splitUnits } from './productInput'
import { Refused } from './http'
import { writeAudit } from './audit'
import type { AdminCaller } from './adminAuth'
import { SHOP_ID } from './stock'

/**
 * Creates or updates a product from the editor, in one transaction. Never
 * touches managedStock or stock quantities (those change only through the
 * count-gated stock routes); it does keep the public stockStatus right when
 * the low-stock level changes on a managed product.
 */
export async function saveProduct(tx: Transaction, caller: AdminCaller, id: string, input: ProductInput, mode: 'create' | 'update') {
  const db = getAdminDb()
  const ref = db.collection('products').doc(id)
  const privRef = db.collection('productPrivate').doc(id)
  const invRef = db.collection('inventory').doc(id)

  // --- reads ---
  const [snap, invSnap] = await tx.getAll(ref, invRef)
  if (mode === 'create' && snap.exists) throw new Refused('A product with this id already exists. Try again.')
  if (mode === 'update' && !snap.exists) throw new Refused('Product not found.', 404)
  const before = snap.data() ?? {}
  const config = readStockConfig(before)

  for (const code of input.barcodes) {
    const clash = await tx.get(db.collection('products').where('barcodes', 'array-contains', code).limit(2))
    const other = clash.docs.find((d) => d.id !== id)
    if (other) throw new Refused(`Barcode ${code} is already on "${other.data().name ?? other.id}". Each barcode can belong to one product only.`)
  }

  let batchSum = 0
  const turningExpiryOn = config.managed && input.trackExpiry && !config.trackExpiry
  if (turningExpiryOn) {
    const bs = await tx.get(db.collection('batches').where('productId', '==', id))
    batchSum = bs.docs.reduce((n, d) => n + (Number(d.data().qtyMilli) || 0), 0)
  }

  // --- writes ---
  const { publicUnits, wholesaleUnits, legacyPriceSen } = splitUnits(input.units)
  const update: Record<string, unknown> = {
    shopId: SHOP_ID,
    name: input.name,
    description: input.description,
    category: input.category,
    imageUrl: input.imageUrl || '/images/placeholder-product.jpg',
    inStock: input.inStock,
    featured: input.featured,
    baseUnit: input.baseUnit,
    lowStockThresholdMilli: input.lowStockThresholdMilli,
    trackExpiry: input.trackExpiry,
    barcodes: input.barcodes,
    sellUnits: publicUnits,
    hasWholesale: wholesaleUnits.length > 0,
    // Older readers (and anything not yet on sell units) read `price`.
    price: legacyPriceSen === null ? FieldValue.delete() : legacyPriceSen / 100,
    updatedAt: FieldValue.serverTimestamp(),
  }
  if (mode === 'create') update.createdAt = FieldValue.serverTimestamp()

  if (config.managed) {
    const inv = invSnap.data() ?? {}
    const onHand = Number(inv.onHandMilli) || 0
    const available = onHand - (Number(inv.reservedMilli) || 0)
    update.stockStatus = deriveStockStatus(available, input.lowStockThresholdMilli)
    if (turningExpiryOn && Math.max(0, onHand) > batchSum) {
      // Stock already on the shelf has no recorded expiry: keep the books
      // balanced with a "no expiry set" batch (listed under Missing expiry).
      tx.set(db.collection('batches').doc(), {
        shopId: SHOP_ID,
        productId: id,
        qtyMilli: Math.max(0, onHand) - batchSum,
        expiryDate: null,
        receivedAt: Date.now(),
      })
    }
  }

  tx.set(ref, update, { merge: true })
  tx.set(privRef, { shopId: SHOP_ID, wholesaleUnits, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
  writeAudit(tx, caller, {
    action: mode === 'create' ? 'product.create' : 'product.update',
    entityType: 'product',
    entityId: id,
    before: mode === 'create' ? null : { name: before.name ?? null, category: before.category ?? null, price: before.price ?? null, sellUnits: before.sellUnits ?? null },
    after: { name: input.name, category: input.category, sellUnits: input.units },
  })
}
