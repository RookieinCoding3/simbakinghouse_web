'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { cn } from '@/lib/utils/cn'
import { useAdminSession } from '@/lib/admin/AdminSession'
import { useAdminProducts, type AdminProduct } from '@/lib/admin/productsStore'
import { inventoryStore, privateStore } from '@/lib/admin/collectionStore'
import { newOpId } from '@/lib/admin/stockView'
import { adminFetch, AdminApiError } from '@/lib/admin/api'
import { recordReads } from '@/lib/admin/readMetrics'
import { normalizeSellUnit, type SellUnit } from '@/lib/inventory/catalog'
import { formatQty } from '@/lib/inventory/units'
import { formatSen } from '@/lib/money'
import { klDateKey, formatKlTime } from '@/lib/time'
import PriceKeypad from '@/components/admin/PriceKeypad'

// Walk-in quick sale. One saleId per sale, made when the sale starts and
// kept across retries, so a double tap or a dropped connection never records
// it twice. "Ask for price" sizes need the price typed at the till; it goes
// on that sale line only.

type Payment = 'cash' | 'duitnow' | 'card' | 'other'
const PAYMENTS: { key: Payment; label: string }[] = [
  { key: 'cash', label: 'Cash' },
  { key: 'duitnow', label: 'DuitNow' },
  { key: 'card', label: 'Card' },
  { key: 'other', label: 'Other' },
]

interface CartLine {
  key: string
  product: AdminProduct
  unit: SellUnit
  qty: number
  /** Unit price for this line: the size's price, or the till price. */
  priceSen: number
  tillPrice: boolean
}

interface ShortItem {
  productId: string
  name: string
  needed: string
  available: string
}

interface SaleRow {
  id: string
  totalSen: number
  paymentMethod: string
  status: string
  oversold: boolean
  atMs: number
  items: { name: string; sellUnitLabel: string; qty: number; priceSource?: string }[]
}

function walkinUnits(p: AdminProduct, wholesale: unknown[] | undefined): SellUnit[] {
  const extra = (wholesale ?? []).map(normalizeSellUnit).filter(Boolean) as SellUnit[]
  return [...p.sellUnits, ...extra]
}

export default function QuickSalePage() {
  const { user } = useAdminSession()
  const { products } = useAdminProducts(!!user)
  const inventory = inventoryStore.use(!!user)
  const privates = privateStore.use(!!user)

  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState<AdminProduct | null>(null)
  const [unitId, setUnitId] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [tillSen, setTillSen] = useState<number | null>(null)

  const [cart, setCart] = useState<CartLine[]>([])
  const [payment, setPayment] = useState<Payment | null>(null)
  const [saleId, setSaleId] = useState(newOpId)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [short, setShort] = useState<ShortItem[]>([])
  const [done, setDone] = useState<string | null>(null)

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!products || !q) return []
    return products
      .filter((p) => p.raw.isDeleted !== true && p.raw.isActive !== false)
      .filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.barcodes.includes(q))
      .slice(0, 8)
  }, [products, search])

  const units = picked ? walkinUnits(picked, privates.docs?.get(picked.id)?.wholesaleUnits) : []
  const unit = units.find((u) => u.id === unitId) ?? null
  const needsTillPrice = unit !== null && unit.priceSen === null
  const canAdd = unit !== null && qty >= 1 && (!needsTillPrice || (tillSen !== null && tillSen > 0))

  const pick = (p: AdminProduct) => {
    const us = walkinUnits(p, privates.docs?.get(p.id)?.wholesaleUnits)
    setPicked(p)
    setUnitId(us.length === 1 ? us[0].id : null)
    setQty(1)
    setTillSen(null)
    setDone(null)
  }

  const addLine = () => {
    if (!picked || !unit || !canAdd) return
    const priceSen = unit.priceSen ?? tillSen!
    const key = `${picked.id}:${unit.id}:${unit.priceSen === null ? priceSen : ''}`
    setCart((cur) => {
      const same = cur.find((l) => l.key === key)
      if (same) return cur.map((l) => (l === same ? { ...l, qty: l.qty + qty } : l))
      return [...cur, { key, product: picked, unit, qty, priceSen, tillPrice: unit.priceSen === null }]
    })
    setPicked(null)
    setSearch('')
    setShort([])
    setError(null)
  }

  const totalSen = cart.reduce((n, l) => n + l.priceSen * l.qty, 0)

  // --- today's sales ---
  const [today, setToday] = useState<SaleRow[] | null>(null)
  const loadToday = useCallback(async () => {
    try {
      const snap = await getDocs(query(collection(db, 'sales'), where('dayKey', '==', klDateKey()), orderBy('atMs', 'desc')))
      recordReads(snap.size)
      setToday(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SaleRow, 'id'>) })))
    } catch {
      setToday([])
    }
  }, [])
  useEffect(() => {
    if (user) loadToday()
  }, [user, loadToday])

  const submit = async (sellAnyway = false) => {
    if (!cart.length || !payment) return
    setBusy(true)
    setError(null)
    try {
      const r = await adminFetch<{ totalSen: number; duplicate: boolean }>('/api/admin/sales', {
        method: 'POST',
        body: JSON.stringify({
          saleId,
          paymentMethod: payment,
          sellAnyway,
          items: cart.map((l) => ({ productId: l.product.id, sellUnitId: l.unit.id, qty: l.qty, ...(l.tillPrice && { tillPriceSen: l.priceSen }) })),
        }),
      })
      // duplicate: an earlier tap already got through (e.g. the reply was
      // lost); the sale on record is that one, not a second copy.
      setDone(r.duplicate ? `This sale was already recorded: ${formatSen(r.totalSen)}` : `Sale recorded: ${formatSen(r.totalSen)}`)
      setCart([])
      setPayment(null)
      setShort([])
      setSaleId(newOpId())
      loadToday()
    } catch (e) {
      if (e instanceof AdminApiError) {
        setError(e.message)
        setShort(Array.isArray(e.data.short) ? (e.data.short as ShortItem[]) : [])
      } else {
        setError('Could not record the sale. Try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  const changeCart = (next: CartLine[]) => {
    setCart(next)
    setShort([])
    setError(null)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-ink text-2xl md:text-3xl">Quick sale</h1>
        <Link href="/admin/stock" prefetch={false} className="text-xs text-muted underline">
          Back to stock
        </Link>
      </div>

      {done && (
        <p role="status" data-testid="sale-done" className="bg-sand rounded px-3 py-2 text-sm">
          {done}
        </p>
      )}

      <section className="space-y-3" aria-label="Add an item">
        <label htmlFor="sale-search" className="block text-xs uppercase tracking-widest text-ink/70">
          Find a product
        </label>
        <input
          id="sale-search"
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPicked(null)
          }}
          placeholder="Name, category or barcode"
          className="w-full bg-white border border-line py-3 px-4 text-base focus:outline-none focus:border-ink/40"
        />
        {!picked && results.length > 0 && (
          <ul className="border border-line divide-y divide-line bg-white" data-testid="sale-results">
            {results.map((p) => {
              const inv = inventory.docs?.get(p.id)
              return (
                <li key={p.id}>
                  <button type="button" onClick={() => pick(p)} className="w-full text-left px-4 py-3 hover:bg-sand">
                    <span className="block text-sm text-ink">{p.name}</span>
                    <span className="block text-xs text-muted">
                      {p.category}
                      {p.config.managed && inv && ` · ${formatQty(inv.onHandMilli - inv.reservedMilli, p.config.baseUnit)} available`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {search.trim() && !picked && products && results.length === 0 && <p className="text-sm text-muted">No products match.</p>}

        {picked && (
          <div className="border border-ink/30 bg-white p-4 space-y-4" data-testid="sale-picker">
            <p className="text-sm font-semibold text-ink">{picked.name}</p>
            <div>
              <span className="block text-xs uppercase tracking-widest text-ink/70 mb-2">Size</span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
                {units.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    role="radio"
                    aria-checked={unitId === u.id}
                    onClick={() => {
                      setUnitId(u.id)
                      setTillSen(null)
                    }}
                    className={cn('px-3 py-2 text-sm border', unitId === u.id ? 'border-ink bg-ink text-paper' : 'border-line')}
                  >
                    {u.label} · {formatSen(u.priceSen)}
                    {u.channel === 'wholesale' && ' (wholesale)'}
                  </button>
                ))}
              </div>
              {units.length === 0 && <p className="text-sm text-clay">This product has no sizes set. Edit it first.</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-widest text-ink/70">Qty</span>
              <button type="button" aria-label="One less" onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-11 h-11 border border-line text-lg">
                −
              </button>
              <span className="w-10 text-center tabular-nums" data-testid="sale-qty">{qty}</span>
              <button type="button" aria-label="One more" onClick={() => setQty((q) => Math.min(999, q + 1))} className="w-11 h-11 border border-line text-lg">
                +
              </button>
            </div>
            {needsTillPrice && (
              <div data-testid="till-price">
                <p className="text-xs text-muted mb-2">
                  &quot;Ask for price&quot; item: type the price you&apos;re charging (each). It&apos;s saved on this sale only.
                </p>
                <PriceKeypad id="till-price" label="Price at the till (each)" valueSen={tillSen} onChange={setTillSen} />
              </div>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={addLine} disabled={!canAdd} className="flex-1 bg-ink text-paper py-3 text-xs uppercase tracking-widest disabled:opacity-40">
                Add to sale
              </button>
              <button type="button" onClick={() => setPicked(null)} className="px-4 border border-line text-xs uppercase tracking-widest">
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3" aria-label="This sale">
        {cart.length === 0 ? (
          <p className="text-sm text-muted">No items yet.</p>
        ) : (
          <ul className="border-y border-line divide-y divide-line" data-testid="sale-cart">
            {cart.map((l) => (
              <li key={l.key} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block text-ink">
                    {l.qty} x {l.product.name} <span className="text-muted">· {l.unit.label}</span>
                  </span>
                  <span className="block text-xs text-muted">
                    {formatSen(l.priceSen)} each{l.tillPrice && ' (till price)'}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums whitespace-nowrap">{formatSen(l.priceSen * l.qty)}</span>
                  <button type="button" aria-label={`Remove ${l.product.name}`} onClick={() => changeCart(cart.filter((x) => x !== l))} className="text-clay px-2 py-1">
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="flex justify-between text-base font-semibold" data-testid="sale-total">
          <span>Total</span>
          <span className="tabular-nums">{formatSen(totalSen)}</span>
        </p>

        <div>
          <span className="block text-xs uppercase tracking-widest text-ink/70 mb-2">Paid by</span>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Paid by">
            {PAYMENTS.map((p) => (
              <button
                key={p.key}
                type="button"
                role="radio"
                aria-checked={payment === p.key}
                onClick={() => setPayment(p.key)}
                className={cn('py-3 text-xs border', payment === p.key ? 'border-ink bg-ink text-paper' : 'border-line')}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div role="alert" className="text-sm text-clay space-y-2">
            <p>{error}</p>
            {short.length > 0 && (
              <>
                <ul className="list-disc pl-5 text-xs" data-testid="sale-short">
                  {short.map((s) => (
                    <li key={s.productId}>
                      {s.name}: selling {s.needed}, only {s.available} available
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => submit(true)} disabled={busy} className="w-full border border-clay text-clay py-3 text-xs uppercase tracking-widest disabled:opacity-40">
                  Sell anyway (fix the stock later)
                </button>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => submit(false)}
          disabled={busy || !cart.length || !payment}
          className="w-full bg-clay text-paper py-4 text-xs uppercase tracking-[0.2em] font-medium disabled:opacity-40"
        >
          {busy ? 'Recording…' : `Done · ${formatSen(totalSen)}`}
        </button>
      </section>

      <TodaySales sales={today} onChanged={loadToday} />
    </div>
  )
}

function TodaySales({ sales, onChanged }: { sales: SaleRow[] | null; onChanged: () => void }) {
  const [voiding, setVoiding] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const doVoid = async (id: string) => {
    setBusy(true)
    setError(null)
    try {
      await adminFetch(`/api/admin/sales/${encodeURIComponent(id)}/void`, { method: 'POST', body: JSON.stringify({ reason }) })
      setVoiding(null)
      setReason('')
      onChanged()
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Could not void the sale.')
    } finally {
      setBusy(false)
    }
  }

  const live = (sales ?? []).filter((s) => s.status !== 'voided')
  return (
    <section className="space-y-3 pt-4 border-t border-line" aria-labelledby="today-title">
      <div className="flex items-baseline justify-between">
        <h2 id="today-title" className="text-sm font-semibold text-ink">Today&apos;s sales</h2>
        {sales && <span className="text-xs text-muted">{live.length} · {formatSen(live.reduce((n, s) => n + (s.totalSen ?? 0), 0))}</span>}
      </div>
      {!sales && <p className="text-sm text-muted">Loading…</p>}
      {sales?.length === 0 && <p className="text-sm text-muted">No sales yet today.</p>}
      <ul className="divide-y divide-line" data-testid="today-sales">
        {sales?.map((s) => (
          <li key={s.id} className={cn('py-3 text-sm space-y-2', s.status === 'voided' && 'opacity-60')} data-sale-id={s.id}>
            <div className="flex justify-between gap-3">
              <span className="min-w-0">
                <span className={cn('block text-ink', s.status === 'voided' && 'line-through')}>
                  {(s.items ?? []).map((i) => `${i.qty} x ${i.name}${i.sellUnitLabel ? ` (${i.sellUnitLabel})` : ''}`).join(', ')}
                </span>
                <span className="block text-xs text-muted">
                  {formatKlTime(s.atMs)} · {s.paymentMethod}
                  {s.oversold && ' · oversold'}
                  {s.status === 'voided' && ' · voided'}
                </span>
              </span>
              <span className="tabular-nums whitespace-nowrap">{formatSen(s.totalSen)}</span>
            </div>
            {s.status !== 'voided' &&
              (voiding === s.id ? (
                <div className="space-y-2">
                  <label htmlFor={`void-${s.id}`} className="block text-xs uppercase tracking-widest text-ink/70">
                    Reason for void
                  </label>
                  <input id={`void-${s.id}`} type="text" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full bg-white border border-line py-2.5 px-3 text-base" />
                  {error && <p role="alert" className="text-xs text-clay">{error}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => doVoid(s.id)} disabled={busy || !reason.trim()} className="flex-1 bg-clay text-paper py-2.5 text-xs uppercase tracking-widest disabled:opacity-40">
                      Confirm void
                    </button>
                    <button type="button" onClick={() => setVoiding(null)} className="px-4 border border-line text-xs uppercase tracking-widest">
                      Keep
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => { setVoiding(s.id); setReason(''); setError(null) }} className="text-xs text-clay underline">
                  Void
                </button>
              ))}
          </li>
        ))}
      </ul>
    </section>
  )
}
