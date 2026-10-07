'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { cn } from '@/lib/utils/cn'
import { useAdminSession } from '@/lib/admin/AdminSession'
import { useAdminProducts } from '@/lib/admin/productsStore'
import { inventoryStore, draftsStore } from '@/lib/admin/collectionStore'
import { buildStockRows, daysAgo, newOpId } from '@/lib/admin/stockView'
import { adminFetch, AdminApiError } from '@/lib/admin/api'
import { recordReads } from '@/lib/admin/readMetrics'
import { formatQty, parseQtyToMilli, milliToString, MILLI } from '@/lib/inventory/units'
import { formatKlDateTime } from '@/lib/time'

type Reason = 'restock' | 'damaged' | 'expired' | 'count'
const REASONS: { key: Reason; label: string; hint: string }[] = [
  { key: 'restock', label: 'Restock', hint: 'adds to stock' },
  { key: 'damaged', label: 'Damaged', hint: 'takes out' },
  { key: 'expired', label: 'Expired', hint: 'takes out' },
  { key: 'count', label: 'Count correction', hint: 'sets the total' },
]

const MOVEMENT_LABEL: Record<string, string> = {
  restock: 'Restock', sale: 'Sold', oversold: 'Sold (oversold)', adjust: 'Adjusted', reserve: 'Held for order',
  release: 'Hold released', expire: 'Expired', damaged: 'Damaged', count: 'Count', void: 'Sale voided',
}

interface MovementRow {
  id: string
  reason: string
  onHandDeltaMilli: number
  reservedDeltaMilli: number
  onHandAfterMilli: number
  byEmail: string | null
  note: string
  at: number | null
  orderId?: string
}

export default function ProductStockPage() {
  const { productId } = useParams<{ productId: string }>()
  const { user } = useAdminSession()
  const { products } = useAdminProducts(!!user)
  const inventory = inventoryStore.use(!!user)
  const drafts = draftsStore.use(!!user)
  const row = useMemo(() => {
    const p = products?.find((x) => x.id === productId)
    return p ? buildStockRows([p], inventory.docs, drafts.docs)[0] : null
  }, [products, inventory.docs, drafts.docs, productId])

  const [history, setHistory] = useState<MovementRow[] | null>(null)
  const loadHistory = useCallback(async () => {
    const snap = await getDocs(query(collection(db, 'stockMovements'), where('productId', '==', productId), orderBy('at', 'desc'), limit(50)))
    recordReads(snap.size)
    setHistory(
      snap.docs.map((d) => {
        const m = d.data()
        return {
          id: d.id,
          reason: String(m.reason),
          onHandDeltaMilli: Number(m.onHandDeltaMilli) || 0,
          reservedDeltaMilli: Number(m.reservedDeltaMilli) || 0,
          onHandAfterMilli: Number(m.onHandAfterMilli) || 0,
          byEmail: typeof m.byEmail === 'string' ? m.byEmail : null,
          note: typeof m.note === 'string' ? m.note : '',
          at: m.at?.toMillis?.() ?? null,
          orderId: typeof m.orderId === 'string' ? m.orderId : undefined,
        }
      })
    )
  }, [productId])
  useEffect(() => {
    if (user && row?.managed) void loadHistory()
  }, [user, row?.managed, loadHistory])

  if (!products) return <div className="h-40 bg-sand/70 rounded animate-pulse" aria-busy="true" />
  if (!row) return <p className="text-sm text-muted">Product not found.</p>

  const unit = row.product.config.baseUnit
  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-1">
        <Link href="/admin/stock" prefetch={false} className="text-xs text-muted hover:text-ink">
          &larr; Stock
        </Link>
        <h1 className="font-heading text-ink text-2xl md:text-3xl">{row.product.name}</h1>
        <p className="text-xs text-muted">
          {row.product.category} · counted in {unit}
          {' · '}
          <Link href={`/admin/products/${row.product.id}`} prefetch={false} className="underline">
            Edit product
          </Link>
        </p>
      </div>

      {row.managed ? (
        <>
          <div className="grid grid-cols-3 gap-2 text-center" data-testid="stock-numbers">
            {[
              ['On hand', row.onHandMilli],
              ['Held for orders', row.reservedMilli],
              ['Available', row.availableMilli],
            ].map(([label, v]) => (
              <div key={label as string} className="bg-white border border-line rounded py-3">
                <p className="text-lg font-semibold text-ink tabular-nums">{formatQty(v as number, unit)}</p>
                <p className="text-[11px] text-muted">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted -mt-6">
            Status: <b>{row.label}</b> (low at {formatQty(row.product.config.lowStockThresholdMilli, unit)}) · last counted {daysAgo(row.lastCountedAt)}
          </p>
          <AdjustForm productId={productId} unit={unit} onHandMilli={row.onHandMilli} trackExpiry={row.product.config.trackExpiry} name={row.product.name} onDone={loadHistory} />
          <section>
            <h2 className="text-sm font-semibold text-ink mb-2">History</h2>
            {!history && <p className="text-xs text-muted">Loading…</p>}
            {history && history.length === 0 && <p className="text-xs text-muted">No changes yet.</p>}
            {history && history.length > 0 && (
              <ul className="divide-y divide-line border-y border-line" data-testid="history">
                {history.map((m) => (
                  <li key={m.id} className="py-2.5 flex justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="text-ink">
                        {MOVEMENT_LABEL[m.reason] ?? m.reason}
                        {m.orderId && <span className="text-muted"> · {m.orderId}</span>}
                      </p>
                      <p className="text-[11px] text-muted truncate">
                        {m.at ? formatKlDateTime(m.at) : 'just now'} · {m.byEmail ?? 'unknown'}
                        {m.note && ` · ${m.note}`}
                      </p>
                    </div>
                    <div className="text-right whitespace-nowrap tabular-nums">
                      {m.onHandDeltaMilli !== 0 ? (
                        <p className={m.onHandDeltaMilli > 0 ? 'text-emerald-800' : 'text-clay'}>
                          {m.onHandDeltaMilli > 0 ? '+' : ''}
                          {formatQty(m.onHandDeltaMilli, unit)}
                        </p>
                      ) : (
                        <p className="text-muted">
                          {m.reservedDeltaMilli > 0 ? 'held ' : 'released '}
                          {formatQty(Math.abs(m.reservedDeltaMilli), unit)}
                        </p>
                      )}
                      <p className="text-[11px] text-muted">→ {formatQty(m.onHandAfterMilli, unit)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <SwitchOff productId={productId} name={row.product.name} />
        </>
      ) : (
        <SwitchOn productId={productId} name={row.product.name} unit={unit} draftMilli={row.draft?.countedMilli ?? null} />
      )}
    </div>
  )
}

function QtyInput({ id, value, onChange, unit, step = MILLI }: { id: string; value: string; onChange: (v: string) => void; unit: string; step?: number }) {
  const bump = (dir: 1 | -1) => {
    const current = parseQtyToMilli(value || '0') ?? 0
    onChange(milliToString(Math.max(0, current + dir * step)))
  }
  return (
    <div className="flex items-stretch">
      <button type="button" onClick={() => bump(-1)} className="w-12 border border-line bg-white text-xl" aria-label="Less">
        −
      </button>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 text-center bg-white border-y border-line py-3 text-lg tabular-nums focus:outline-none"
        placeholder="0"
      />
      <span className="flex items-center px-3 border-y border-line bg-sand text-sm text-muted">{unit}</span>
      <button type="button" onClick={() => bump(1)} className="w-12 border border-line bg-white text-xl" aria-label="More">
        +
      </button>
    </div>
  )
}

function AdjustForm({ productId, unit, onHandMilli, trackExpiry, name, onDone }: { productId: string; unit: string; onHandMilli: number; trackExpiry: boolean; name: string; onDone: () => void }) {
  const [reason, setReason] = useState<Reason>('restock')
  const [qty, setQty] = useState('')
  const [expiry, setExpiry] = useState('')
  const [note, setNote] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [opId, setOpId] = useState(newOpId)

  const milli = parseQtyToMilli(qty)
  const valid = milli !== null && (reason === 'count' ? milli >= 0 : milli > 0)
  const after = milli === null ? null : reason === 'restock' ? onHandMilli + milli : reason === 'count' ? milli : onHandMilli - milli

  const submit = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await adminFetch('/api/admin/stock/adjust', {
        method: 'POST',
        body: JSON.stringify({
          opId,
          productId,
          reason,
          ...(reason === 'count' ? { countedMilli: milli } : { qtyMilli: milli }),
          ...(reason === 'restock' && trackExpiry && expiry ? { expiryDate: expiry } : {}),
          note,
        }),
      })
      setMessage({ ok: true, text: `Saved: ${name} is now ${formatQty(after!, unit)}.` })
      setQty('')
      setNote('')
      setExpiry('')
      setConfirming(false)
      setOpId(newOpId())
      onDone()
    } catch (e) {
      setMessage({ ok: false, text: e instanceof AdminApiError ? e.message : 'Could not save.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="border border-line rounded p-4 space-y-4 bg-white" aria-labelledby="adjust-title">
      <h2 id="adjust-title" className="text-sm font-semibold text-ink">
        Change stock
      </h2>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Reason">
        {REASONS.map((r) => (
          <button
            key={r.key}
            type="button"
            role="radio"
            aria-checked={reason === r.key}
            onClick={() => {
              setReason(r.key)
              setConfirming(false)
            }}
            className={cn('px-3 py-2.5 text-left text-sm border rounded', reason === r.key ? 'border-ink bg-ink text-paper' : 'border-line')}
          >
            {r.label}
            <span className={cn('block text-[11px]', reason === r.key ? 'text-paper/70' : 'text-muted')}>{r.hint}</span>
          </button>
        ))}
      </div>
      <div>
        <label htmlFor="adjust-qty" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
          {reason === 'count' ? 'Counted on the shelf' : 'How much'}
        </label>
        <QtyInput id="adjust-qty" value={qty} onChange={(v) => { setQty(v); setConfirming(false) }} unit={unit} />
      </div>
      {reason === 'restock' && trackExpiry && (
        <div>
          <label htmlFor="adjust-expiry" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
            Expiry date
          </label>
          <input id="adjust-expiry" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="w-full bg-white border border-line py-3 px-4 text-base" />
          <p className="text-[11px] text-muted mt-1">Leave empty if unknown — it will be listed under &ldquo;missing expiry&rdquo;.</p>
        </div>
      )}
      <div>
        <label htmlFor="adjust-note" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
          Note (optional)
        </label>
        <input id="adjust-note" type="text" value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-white border border-line py-3 px-4 text-base" />
      </div>
      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={cn('text-sm rounded px-3 py-2', message.ok ? 'bg-sand text-ink' : 'bg-clay/10 text-clay')}>
          {message.text}
        </p>
      )}
      {!confirming ? (
        <button
          type="button"
          disabled={!valid}
          onClick={() => setConfirming(true)}
          className="w-full bg-ink text-paper py-3.5 text-xs uppercase tracking-widest disabled:opacity-40"
        >
          Review
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-ink bg-sand rounded px-3 py-2 tabular-nums" data-testid="confirm-line">
            {name}: {formatQty(onHandMilli, unit)} → <b>{formatQty(after!, unit)}</b>
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={submit} disabled={busy} className="flex-1 bg-ink text-paper py-3.5 text-xs uppercase tracking-widest disabled:opacity-50">
              {busy ? 'Saving…' : 'Confirm'}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="px-4 border border-line text-xs uppercase tracking-widest">
              Back
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function SwitchOn({ productId, name, unit, draftMilli }: { productId: string; name: string; unit: string; draftMilli: number | null }) {
  const [qty, setQty] = useState(draftMilli !== null ? milliToString(draftMilli) : '')
  // Saved counts usually arrive after the page first renders (opened from a
  // link or reloaded): fill them in then, unless something was typed already.
  useEffect(() => {
    if (draftMilli !== null) setQty((cur) => (cur === '' ? milliToString(draftMilli) : cur))
  }, [draftMilli])
  const [stopped, setStopped] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const milli = parseQtyToMilli(qty)

  const switchOn = async () => {
    if (milli === null) return
    setBusy(true)
    setError(null)
    try {
      await adminFetch('/api/admin/stock/count', { method: 'POST', body: JSON.stringify({ opId: newOpId(), counts: [{ productId, countedMilli: milli }] }) })
      await adminFetch('/api/admin/stock/manage', { method: 'POST', body: JSON.stringify({ opId: newOpId(), productIds: [productId], on: true, confirmOldSystemStopped: true }) })
      setDone(true)
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Could not switch on.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="border border-line rounded p-4 space-y-4 bg-white" aria-labelledby="switch-on-title">
      <div>
        <h2 id="switch-on-title" className="text-sm font-semibold text-ink">
          Not managed here yet
        </h2>
        <p className="text-xs text-muted mt-1">
          This product sells exactly as before: no stock numbers, no checks, no status shown to customers. To manage it here,
          count it first.
        </p>
      </div>
      <div>
        <label htmlFor="opening-count" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
          1. How many are on the shelf now?
        </label>
        <QtyInput id="opening-count" value={qty} onChange={setQty} unit={unit} />
        <button type="button" onClick={() => setQty('0')} className="text-xs text-muted underline mt-1">
          None in stock — set to 0
        </button>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={stopped} onChange={(e) => setStopped(e.target.checked)} className="mt-1" id="stopped-old" />
        <span>
          2. From now on I&apos;ll update <b>{name}</b> here only, and <b>stop updating it in the old system</b>.
        </span>
      </label>
      {error && <p role="alert" className="text-sm text-clay">{error}</p>}
      {done ? (
        <p role="status" className="text-sm bg-sand rounded px-3 py-2">Switched on. Stock is now managed here.</p>
      ) : (
        <button type="button" disabled={milli === null || !stopped || busy} onClick={switchOn} className="w-full bg-ink text-paper py-3.5 text-xs uppercase tracking-widest disabled:opacity-40">
          {busy ? 'Switching on…' : '3. Switch on'}
        </button>
      )}
    </section>
  )
}

function SwitchOff({ productId, name }: { productId: string; name: string }) {
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const off = async () => {
    setBusy(true)
    setError(null)
    try {
      await adminFetch('/api/admin/stock/manage', { method: 'POST', body: JSON.stringify({ opId: newOpId(), productIds: [productId], on: false }) })
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Could not switch off.')
    } finally {
      setBusy(false)
      setConfirm(false)
    }
  }
  return (
    <section className="pt-4 border-t border-line text-sm space-y-2">
      {error && <p role="alert" className="text-clay">{error}</p>}
      {!confirm ? (
        <button type="button" onClick={() => setConfirm(true)} className="text-xs uppercase tracking-widest text-clay">
          Stop managing stock here
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-ink">
            {name} will sell like before (no status, no stock checks). The numbers and history stay saved; switching back on needs a
            fresh count.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={off} disabled={busy} className="bg-clay text-paper px-4 py-2.5 text-xs uppercase tracking-widest">
              Stop managing
            </button>
            <button type="button" onClick={() => setConfirm(false)} className="px-4 py-2.5 text-xs uppercase tracking-widest border border-line">
              Keep
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
