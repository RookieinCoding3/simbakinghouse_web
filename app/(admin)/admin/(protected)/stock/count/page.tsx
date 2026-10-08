'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { useAdminSession } from '@/lib/admin/AdminSession'
import { useAdminProducts } from '@/lib/admin/productsStore'
import { inventoryStore, draftsStore } from '@/lib/admin/collectionStore'
import { buildStockRows, newOpId } from '@/lib/admin/stockView'
import { adminFetch, AdminApiError } from '@/lib/admin/api'
import { formatQty, parseQtyToMilli } from '@/lib/inventory/units'

const SAVE_KEY = 'sbh-admin-count-in-progress'

export default function CountPage() {
  const { user } = useAdminSession()
  const { products } = useAdminProducts(!!user)
  const inventory = inventoryStore.use(!!user)
  const drafts = draftsStore.use(!!user)
  const [category, setCategory] = useState('')
  const [managedOnly, setManagedOnly] = useState(true)
  const [entries, setEntries] = useState<Record<string, string>>({})
  const [reviewing, setReviewing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [opId, setOpId] = useState(newOpId)

  // A shelf walk can take a while: keep what's typed if the page reloads.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY)
      if (saved) setEntries(JSON.parse(saved))
    } catch {}
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(entries))
    } catch {}
  }, [entries])

  const rows = useMemo(() => (products ? buildStockRows(products, inventory.docs, drafts.docs) : []), [products, inventory.docs, drafts.docs])
  const categories = useMemo(() => [...new Set(rows.map((r) => r.product.category).filter(Boolean))].sort(), [rows])
  const visible = rows.filter((r) => (!category || r.product.category === category) && (!managedOnly || r.managed))
  const entered = rows
    .map((r) => ({ r, milli: entries[r.product.id] !== undefined ? parseQtyToMilli(entries[r.product.id]) : undefined }))
    .filter((x): x is { r: (typeof rows)[number]; milli: number } => typeof x.milli === 'number')
  const invalid = Object.entries(entries).filter(([, v]) => v.trim() !== '' && parseQtyToMilli(v) === null).length

  const apply = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const res = await adminFetch<{ applied: number; drafts: number }>('/api/admin/stock/count', {
        method: 'POST',
        body: JSON.stringify({ opId, counts: entered.map((e) => ({ productId: e.r.product.id, countedMilli: e.milli })) }),
      })
      setMessage({ ok: true, text: `Count saved: ${res.applied} managed product${res.applied === 1 ? '' : 's'} updated${res.drafts ? `, ${res.drafts} opening count${res.drafts === 1 ? '' : 's'} saved for switching on` : ''}.` })
      setEntries({})
      setReviewing(false)
      setOpId(newOpId())
    } catch (e) {
      setMessage({ ok: false, text: e instanceof AdminApiError ? e.message : 'Could not save the count.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <Link href="/admin/stock" prefetch={false} className="text-xs text-muted hover:text-ink">
          &larr; Stock
        </Link>
        <h1 className="font-heading text-ink text-2xl md:text-3xl">Count stock</h1>
        <p className="text-xs text-muted">Type what is really on the shelf. Nothing changes until you review and apply.</p>
      </div>

      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={cn('text-sm rounded px-3 py-2', message.ok ? 'bg-sand' : 'bg-clay/10 text-clay')}>
          {message.text}
        </p>
      )}

      {!reviewing ? (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <label htmlFor="count-category" className="sr-only">Category</label>
            <select id="count-category" value={category} onChange={(e) => setCategory(e.target.value)} className="bg-white border border-line py-2.5 px-3 text-sm">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" id="managed-only" checked={managedOnly} onChange={(e) => setManagedOnly(e.target.checked)} />
              Managed only
            </label>
          </div>

          <ul className="divide-y divide-line border-y border-line">
            {visible.map((r) => {
              const v = entries[r.product.id] ?? ''
              const milli = v.trim() === '' ? null : parseQtyToMilli(v)
              const diff = milli === null || !r.managed ? null : milli - r.onHandMilli
              const unit = r.product.config.baseUnit
              return (
                <li key={r.product.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink truncate">{r.product.name}</p>
                    <p className="text-xs text-muted tabular-nums">
                      {r.managed ? `system says ${formatQty(r.onHandMilli, unit)}` : 'not managed — saved as opening count'}
                      {diff !== null && diff !== 0 && (
                        <span className={diff > 0 ? 'text-emerald-800' : 'text-clay'}> · {diff > 0 ? '+' : ''}{formatQty(diff, unit)}</span>
                      )}
                      {diff === 0 && <span> · matches</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      aria-label={`Counted ${r.product.name}`}
                      type="text"
                      inputMode="decimal"
                      value={v}
                      onChange={(e) => setEntries((x) => ({ ...x, [r.product.id]: e.target.value }))}
                      className={cn('w-20 text-right bg-white border py-2.5 px-2 text-base tabular-nums', milli === null && v.trim() !== '' ? 'border-clay' : 'border-line')}
                      placeholder="—"
                    />
                    <span className="text-xs text-muted w-8">{unit}</span>
                  </div>
                </li>
              )
            })}
          </ul>
          {visible.length === 0 && <p className="text-sm text-muted">No products here{managedOnly && ' — untick “Managed only” to count products you are switching over'}.</p>}

          <div className="sticky bottom-20 md:bottom-4 bg-paper/95 backdrop-blur py-2">
            <button
              type="button"
              disabled={entered.length === 0 || invalid > 0}
              onClick={() => setReviewing(true)}
              className="w-full bg-ink text-paper py-3.5 text-xs uppercase tracking-widest disabled:opacity-40"
            >
              {invalid > 0 ? `Fix ${invalid} number${invalid === 1 ? '' : 's'}` : `Review ${entered.length} count${entered.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </>
      ) : (
        <section className="space-y-4" aria-labelledby="review-title">
          <h2 id="review-title" className="text-sm font-semibold">Review before applying</h2>
          <ul className="divide-y divide-line border-y border-line text-sm" data-testid="count-review">
            {entered.map(({ r, milli }) => {
              const unit = r.product.config.baseUnit
              return (
                <li key={r.product.id} className="py-2.5 flex justify-between gap-3 tabular-nums">
                  <span className="truncate">{r.product.name}</span>
                  <span className="whitespace-nowrap">
                    {r.managed ? (
                      <>
                        {formatQty(r.onHandMilli, unit)} → <b>{formatQty(milli, unit)}</b>
                      </>
                    ) : (
                      <>opening count <b>{formatQty(milli, unit)}</b></>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
          <div className="flex gap-2">
            <button type="button" onClick={apply} disabled={busy} className="flex-1 bg-ink text-paper py-3.5 text-xs uppercase tracking-widest disabled:opacity-50">
              {busy ? 'Applying…' : 'Apply count'}
            </button>
            <button type="button" onClick={() => setReviewing(false)} className="px-4 border border-line text-xs uppercase tracking-widest">
              Back
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
