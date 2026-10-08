'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { useAdminSession } from '@/lib/admin/AdminSession'
import { useAdminProducts } from '@/lib/admin/productsStore'
import { inventoryStore, draftsStore } from '@/lib/admin/collectionStore'
import { buildStockRows, newOpId, type StockRow } from '@/lib/admin/stockView'
import { adminFetch, AdminApiError } from '@/lib/admin/api'
import { formatQty, parseQtyToMilli, milliToString } from '@/lib/inventory/units'

/**
 * Moving one category at a time from the old system to managed stock here.
 * Nothing about a product changes until its category is switched on, and
 * that needs a count for every product in it.
 */
export default function SwitchOverPage() {
  const { user } = useAdminSession()
  const { products } = useAdminProducts(!!user)
  const inventory = inventoryStore.use(!!user)
  const drafts = draftsStore.use(!!user)
  const [open, setOpen] = useState<string | null>(null)

  const rows = useMemo(() => (products ? buildStockRows(products, inventory.docs, drafts.docs) : null), [products, inventory.docs, drafts.docs])
  const byCategory = useMemo(() => {
    const m = new Map<string, StockRow[]>()
    for (const r of rows ?? []) {
      const c = r.product.category || 'Uncategorised'
      m.set(c, [...(m.get(c) ?? []), r])
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [rows])

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/admin/stock" prefetch={false} className="text-xs text-muted hover:text-ink">
          &larr; Stock
        </Link>
        <h1 className="font-heading text-ink text-2xl md:text-3xl">Switch over</h1>
      </div>

      <ol className="border border-line rounded p-4 bg-white space-y-2 text-sm list-decimal pl-8">
        <li><b>Count</b> every product in the category (enter 0 for anything not in stock).</li>
        <li><b>Switch the category on.</b> From then on, stock for these products is tracked here.</li>
        <li><b>Stop updating the old system</b> for these products, the same day.</li>
      </ol>

      {!rows && <div className="h-40 bg-sand/70 rounded animate-pulse" aria-busy="true" />}

      <ul className="space-y-2">
        {byCategory.map(([category, list]) => {
          const managed = list.filter((r) => r.managed).length
          return (
            <li key={category} className="border border-line rounded bg-white">
              <button
                type="button"
                onClick={() => setOpen(open === category ? null : category)}
                aria-expanded={open === category}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="font-medium text-ink">{category}</span>
                <span className={cn('text-xs tabular-nums', managed === list.length ? 'text-emerald-800' : 'text-muted')} data-testid={`progress-${category}`}>
                  {managed} of {list.length} managed
                </span>
              </button>
              {open === category && <CategorySwitch category={category} rows={list} />}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function CategorySwitch({ category, rows }: { category: string; rows: StockRow[] }) {
  const pending = rows.filter((r) => !r.managed)
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(pending.map((r) => [r.product.id, r.draft ? milliToString(r.draft.countedMilli) : '']))
  )
  // Same for counts that load after the category was opened.
  useEffect(() => {
    setValues((cur) => {
      const missing = pending.filter((r) => r.draft && !cur[r.product.id])
      if (missing.length === 0) return cur // same object: no re-render
      return { ...cur, ...Object.fromEntries(missing.map((r) => [r.product.id, milliToString(r.draft!.countedMilli)])) }
    })
  }, [pending])
  const [confirming, setConfirming] = useState(false)
  const [stopped, setStopped] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const unsaved = pending.filter((r) => {
    const m = parseQtyToMilli(values[r.product.id] ?? '')
    return m !== null && m !== r.draft?.countedMilli
  })
  const allCounted = pending.every((r) => r.draft !== null)

  const saveCounts = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await adminFetch('/api/admin/stock/count', {
        method: 'POST',
        body: JSON.stringify({ opId: newOpId(), counts: unsaved.map((r) => ({ productId: r.product.id, countedMilli: parseQtyToMilli(values[r.product.id])! })) }),
      })
      setMessage({ ok: true, text: `Saved ${unsaved.length} count${unsaved.length === 1 ? '' : 's'}.` })
    } catch (e) {
      setMessage({ ok: false, text: e instanceof AdminApiError ? e.message : 'Could not save.' })
    } finally {
      setBusy(false)
    }
  }

  const switchOn = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const res = await adminFetch<{ switched: number }>('/api/admin/stock/manage', {
        method: 'POST',
        body: JSON.stringify({ opId: newOpId(), productIds: pending.map((r) => r.product.id), on: true, confirmOldSystemStopped: true }),
      })
      setMessage({ ok: true, text: `${category}: ${res.switched} product${res.switched === 1 ? '' : 's'} now managed here.` })
      setConfirming(false)
    } catch (e) {
      setMessage({ ok: false, text: e instanceof AdminApiError ? e.message : 'Could not switch on.' })
    } finally {
      setBusy(false)
    }
  }

  if (pending.length === 0) {
    return <p className="px-4 pb-4 text-sm text-emerald-800">Every product in {category} is managed here.</p>
  }

  return (
    <div className="px-4 pb-4 space-y-4 border-t border-line pt-3">
      <ul className="divide-y divide-line">
        {pending.map((r) => {
          const unit = r.product.config.baseUnit
          const v = values[r.product.id] ?? ''
          const bad = v.trim() !== '' && parseQtyToMilli(v) === null
          return (
            <li key={r.product.id} className="py-2.5 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{r.product.name}</p>
                <p className="text-xs text-muted">{r.draft ? `counted ${formatQty(r.draft.countedMilli, unit)}` : 'not counted yet'}</p>
              </div>
              <input
                aria-label={`Count for ${r.product.name}`}
                type="text"
                inputMode="decimal"
                value={v}
                onChange={(e) => setValues((x) => ({ ...x, [r.product.id]: e.target.value }))}
                className={cn('w-20 text-right bg-white border py-2.5 px-2 text-base tabular-nums', bad ? 'border-clay' : 'border-line')}
              />
              <span className="text-xs text-muted w-8">{unit}</span>
              <button type="button" onClick={() => setValues((x) => ({ ...x, [r.product.id]: '0' }))} className="text-xs text-muted underline whitespace-nowrap">
                Set 0
              </button>
            </li>
          )
        })}
      </ul>
      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={cn('text-sm rounded px-3 py-2', message.ok ? 'bg-sand' : 'bg-clay/10 text-clay')}>
          {message.text}
        </p>
      )}
      {unsaved.length > 0 && (
        <button type="button" onClick={saveCounts} disabled={busy} className="w-full border border-ink py-3 text-xs uppercase tracking-widest">
          Save {unsaved.length} count{unsaved.length === 1 ? '' : 's'}
        </button>
      )}
      {!confirming ? (
        <button
          type="button"
          disabled={!allCounted || unsaved.length > 0 || busy}
          onClick={() => setConfirming(true)}
          className="w-full bg-ink text-paper py-3.5 text-xs uppercase tracking-widest disabled:opacity-40"
        >
          {allCounted ? `Switch ${category} to managed` : `Count all ${pending.length} products first`}
        </button>
      ) : (
        <div className="border border-clay/40 bg-clay/5 rounded p-3 space-y-3">
          <p className="text-sm text-ink">
            After this, stock for these {pending.length} products is tracked <b>here</b>. The old system must <b>no longer be used</b> for
            them, or the numbers will drift apart.
          </p>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" id="confirm-old-system" checked={stopped} onChange={(e) => setStopped(e.target.checked)} className="mt-1" />I will stop
            updating these {pending.length} products in the old system today.
          </label>
          <div className="flex gap-2">
            <button type="button" disabled={!stopped || busy} onClick={switchOn} className="flex-1 bg-ink text-paper py-3 text-xs uppercase tracking-widest disabled:opacity-40">
              {busy ? 'Switching…' : 'Switch on'}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="px-4 border border-line text-xs uppercase tracking-widest">
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
