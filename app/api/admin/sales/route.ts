import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase/admin'
import { requireAdmin } from '@/lib/server/adminAuth'
import { writeAudit } from '@/lib/server/audit'
import { StockSession, SHOP_ID } from '@/lib/server/stock'
import { resolveLines, neededPerProduct, LineError, type LineRequest } from '@/lib/server/lines'
import { deduct } from '@/lib/inventory/engine'
import { formatQty } from '@/lib/inventory/units'
import { klDateKey } from '@/lib/time'
import { Refused, readJson, handleRouteError, isOpId } from '@/lib/server/http'

export const runtime = 'nodejs'

const PAYMENT_METHODS = ['cash', 'duitnow', 'card', 'other'] as const
const MAX_TILL_PRICE_SEN = 10_000_000

/**
 * Records a walk-in sale. The phone generates `saleId` once per sale, so a
 * double tap on "Done" (or a retry after a dropped connection) finds the
 * sale already recorded and changes nothing. Managed products: stock comes
 * straight off the shelf (no hold), first-expiry-first-out; selling more
 * than is available needs an explicit "sell anyway", recorded as
 * "oversold". Unmanaged products: the sale is recorded, stock untouched.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response
  const b = await readJson(request)
  const paymentMethod = b.paymentMethod as (typeof PAYMENT_METHODS)[number]
  const rawItems = Array.isArray(b.items) ? b.items : []
  const items: LineRequest[] = []
  // Price typed at the till, per line — used only for "Ask for price" sizes.
  const tillPrices: (number | null)[] = []
  for (const r of rawItems) {
    const it = (r ?? {}) as Record<string, unknown>
    if (typeof it.productId !== 'string' || typeof it.qty !== 'number' || !Number.isInteger(it.qty) || it.qty < 1 || it.qty > 999) {
      return NextResponse.json({ error: 'Invalid item.' }, { status: 400 })
    }
    const till = it.tillPriceSen
    if (till !== undefined && till !== null && (typeof till !== 'number' || !Number.isInteger(till) || till < 1 || till > MAX_TILL_PRICE_SEN)) {
      return NextResponse.json({ error: 'Enter a valid price.' }, { status: 400 })
    }
    items.push({ productId: it.productId, sellUnitId: typeof it.sellUnitId === 'string' ? it.sellUnitId : null, qty: it.qty })
    tillPrices.push(typeof till === 'number' ? till : null)
  }
  if (!isOpId(b.saleId) || items.length === 0 || items.length > 100 || !PAYMENT_METHODS.includes(paymentMethod)) {
    return NextResponse.json({ error: 'Add at least one item and choose how they paid.' }, { status: 400 })
  }
  const saleId = b.saleId
  const sellAnyway = b.sellAnyway === true
  const db = getAdminDb()
  const saleRef = db.collection('sales').doc(saleId)

  try {
    const result = await db.runTransaction(async (tx) => {
      const existing = await tx.get(saleRef)
      if (existing.exists) return { duplicate: true, totalSen: existing.data()!.totalSen as number }

      const ids = [...new Set(items.map((i) => i.productId))]
      const snaps = await tx.getAll(
        ...ids.map((id) => db.collection('products').doc(id)),
        ...ids.map((id) => db.collection('productPrivate').doc(id))
      )
      const lines = resolveLines(
        items,
        new Map(ids.map((id, i) => [id, snaps[i]])),
        new Map(ids.map((id, i) => [id, snaps[ids.length + i]])),
        'walkin'
      )
      // "Ask for price" sizes take the price typed at the till, for this sale
      // line only (the product stays "Ask for price"). A priced size always
      // sells at its own price; a till price sent for it is ignored.
      const priced = lines.map((l, i) => {
        if (l.unitPriceSen !== null) return { ...l, priceSource: 'catalog' as const }
        const till = tillPrices[i]
        return till === null ? l : { ...l, unitPriceSen: till, lineTotalSen: till * l.qty, priceSource: 'till' as const }
      })
      const unpriced = priced.filter((l) => l.unitPriceSen === null)
      if (unpriced.length) throw new Refused(`Type the price for ${unpriced.map((l) => `${l.name} (${l.unit.label})`).join(', ')} first.`, 400)

      const need = neededPerProduct(lines.filter((l) => l.managed))
      const session = new StockSession(tx, auth.caller)
      await session.load([...need.keys()])
      const short = [...need.entries()]
        .filter(([id, n]) => n > session.available(id))
        .map(([id, n]) => ({
          productId: id,
          name: lines.find((l) => l.productId === id)!.name,
          needed: formatQty(n, session.item(id).config.baseUnit),
          available: formatQty(Math.max(0, session.available(id)), session.item(id).config.baseUnit),
        }))
      if (short.length && !sellAnyway) {
        throw new Refused(
          `Not enough stock: ${short.map((s) => `${s.name} (selling ${s.needed}, only ${s.available} available)`).join('; ')}.`,
          409,
          { short, canSellAnyway: true }
        )
      }

      const shortIds = new Set(short.map((s) => s.productId))
      const stock: { productId: string; qtyMilli: number; reason: string; allocations: unknown[] }[] = []
      for (const [id, n] of need) {
        const reason = shortIds.has(id) ? 'oversold' : 'sale'
        const m = session.apply(id, (s) => deduct(s, n, reason), { saleId, note: reason === 'oversold' ? 'sold anyway — fix stock later' : '' })
        stock.push({ productId: id, qtyMilli: n, reason, allocations: m?.allocations ?? [] })
      }

      const totalSen = priced.reduce((sum, l) => sum + (l.lineTotalSen ?? 0), 0)
      tx.set(saleRef, {
        shopId: SHOP_ID,
        source: 'walkin',
        status: 'completed',
        items: priced.map((l) => ({
          productId: l.productId,
          name: l.name,
          sellUnitId: l.unit.id,
          sellUnitLabel: l.unit.label,
          channel: l.unit.channel,
          factorMilli: l.unit.factorMilli,
          qty: l.qty,
          baseQtyMilli: l.baseQtyMilli,
          unitPriceSen: l.unitPriceSen,
          lineTotalSen: l.lineTotalSen,
          priceSource: 'priceSource' in l ? l.priceSource : 'catalog',
          managed: l.managed,
        })),
        stock,
        oversold: short.length > 0,
        totalSen,
        paymentMethod,
        byUid: auth.caller.uid,
        byEmail: auth.caller.email,
        at: FieldValue.serverTimestamp(),
        atMs: Date.now(),
        dayKey: klDateKey(),
      })
      session.commit()
      writeAudit(tx, auth.caller, { action: 'sale.walkin', entityType: 'sale', entityId: saleId, before: null, after: { totalSen, paymentMethod, oversold: short.length > 0 } })
      return { duplicate: false, totalSen }
    })
    return NextResponse.json({ ok: true, saleId, ...result }, { status: result.duplicate ? 200 : 201 })
  } catch (error) {
    if (error instanceof LineError) return NextResponse.json({ error: error.message }, { status: error.status })
    return handleRouteError('admin/sales', error)
  }
}
