'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAdminSession } from '@/lib/admin/AdminSession'
import { adminFetch, AdminApiError } from '@/lib/admin/api'
import { formatQty } from '@/lib/inventory/units'
import { formatSen } from '@/lib/money'
import { cn } from '@/lib/utils/cn'
import { PageSkeleton } from '@/components/admin/AdminShell'
import { AdjustDialog, ReceiveBatchDialog } from '@/components/admin/StockDialogs'

interface Row {
  id: string
  name: string
  nameZh: string
  code: string
  category: string
  imageUrl: string
  unit: string
  chilled: boolean
  sellPriceSen: number | null
  onHandMilli: number
  reservedMilli: number
  availableMilli: number
  lowAtMilli: number
  counted: boolean
  latestCostSen: number | null
  batches: { id: string; qtyMilli: number; expiryDate: string | null; supplierName: string | null; unitCostSen: number | null; locationId: string }[]
}

type Quick = 'all' | 'expiring' | 'out' | 'low' | 'chilled'
const QUICK: { key: Quick; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'expiring', label: '⚠️ Expiring soon' },
  { key: 'out', label: '🔴 Out of stock' },
  { key: 'low', label: '🟡 Low stock' },
  { key: 'chilled', label: '❄️ Chilled' },
]

const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const shortDate = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })

/** Stock & batches: shared with the SBH Inventory iPad (same records). */
export default function StockPage() {
  const { user } = useAdminSession()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [today, setToday] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [quick, setQuick] = useState<Quick>('all')
  const [receiveFor, setReceiveFor] = useState<string | null | undefined>(undefined)
  const [adjustFor, setAdjustFor] = useState<string | null>(null)

  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get('filter') as Quick | null
    if (f && QUICK.some((q) => q.key === f)) setQuick(f)
  }, [])

  const load = useCallback(() => {
    adminFetch<{ today: string; rows: Row[] }>('/api/admin/inventory')
      .then((d) => {
        setRows(d.rows)
        setToday(d.today)
        setError(null)
      })
      .catch((e) => setError(e instanceof AdminApiError ? e.message : 'Could not load stock.'))
  }, [])
  useEffect(() => {
    if (user) load()
  }, [user, load])

  const soon = today ? addDays(today, 14) : ''
  const flags = useCallback(
    (r: Row) => ({
      out: r.counted && r.availableMilli <= 0,
      low: r.counted && r.availableMilli > 0 && r.lowAtMilli > 0 && r.availableMilli <= r.lowAtMilli,
      expiring: r.batches.some((b) => b.expiryDate && b.expiryDate <= soon),
    }),
    [soon],
  )

  const categories = useMemo(() => [...new Set((rows ?? []).map((r) => r.category).filter(Boolean))].sort(), [rows])
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (rows ?? []).filter((r) => {
      if (category && r.category !== category) return false
      if (q && !`${r.name} ${r.nameZh} ${r.code}`.toLowerCase().includes(q)) return false
      const f = flags(r)
      if (quick === 'expiring') return f.expiring
      if (quick === 'out') return f.out
      if (quick === 'low') return f.low || f.out
      if (quick === 'chilled') return r.chilled
      return true
    })
  }, [rows, search, category, quick, flags])

  if (error && !rows) {
    return (
      <div role="alert" className="py-12 text-center space-y-4">
        <p className="text-sm text-ink">{error}</p>
        <button onClick={load} className="bg-ink text-paper text-xs uppercase tracking-widest px-5 py-3">Retry</button>
      </div>
    )
  }
  if (!rows) return <PageSkeleton />

  const pill = (active: boolean) => cn('px-4 min-h-[44px] rounded-full text-sm whitespace-nowrap', active ? 'bg-ink text-paper' : 'bg-sand text-ink')
  const adjustRow = rows.find((r) => r.id === adjustFor)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-ink text-2xl md:text-3xl">Stock & batches</h1>
          <p className="text-xs text-muted mt-1">Same stock as the SBH Inventory iPad. Sold first: the soonest expiry.</p>
        </div>
        <button onClick={() => setReceiveFor(null)} className="bg-ink text-paper rounded-xl px-5 min-h-[48px] text-sm font-semibold">+ Receive batch</button>
      </div>

      <div className="space-y-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, 中文 or code"
          aria-label="Search stock"
          className="w-full bg-white border border-line rounded-xl py-3 px-4 text-base min-h-[48px] focus:outline-none focus:border-ink/40"
        />
        <div className="-mx-4 px-4 overflow-x-auto">
          <div className="flex gap-2 w-max" role="group" aria-label="Category">
            <button className={pill(category === null)} onClick={() => setCategory(null)}>All categories</button>
            {categories.map((c) => (
              <button key={c} className={pill(category === c)} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>
        </div>
        <div className="-mx-4 px-4 overflow-x-auto">
          <div className="flex gap-2 w-max" role="group" aria-label="Quick filters">
            {QUICK.map((q) => (
              <button key={q.key} className={pill(quick === q.key)} aria-pressed={quick === q.key} onClick={() => setQuick(q.key)} data-testid={`quick-${q.key}`}>{q.label}</button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted">{shown.length} of {rows.length} products</p>

      <ul className="space-y-3" data-testid="stock-rows">
        {shown.map((r) => {
          const f = flags(r)
          const latestBatchCost = [...r.batches].reverse().find((b) => b.unitCostSen !== null)?.unitCostSen ?? r.latestCostSen
          return (
            <li key={r.id} className="bg-white border border-line rounded-2xl p-4 grid gap-3 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,2.4fr)_minmax(0,1.3fr)_auto] md:items-center" data-testid="stock-row" data-product={r.id}>
              <div className="flex items-center gap-3 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- product thumbnails (Storage or placeholder) */}
                <img src={r.imageUrl || '/images/placeholder-product.jpg'} alt="" className="w-12 h-12 rounded-lg object-cover border border-line flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{r.chilled ? '❄️ ' : ''}{r.name}</p>
                  <p className="text-xs text-muted truncate">{r.category}{r.code ? ` · ${r.code}` : ''} · counted in {r.unit}</p>
                </div>
              </div>
              <div>
                <p className={cn('text-base font-semibold', f.out ? 'text-[#B42318]' : f.low ? 'text-[#B54708]' : 'text-ink')} data-testid="on-hand">
                  {r.counted ? formatQty(r.onHandMilli, r.unit) : 'Not counted'}
                </p>
                {r.reservedMilli > 0 && <p className="text-xs text-muted">{formatQty(r.reservedMilli, r.unit)} held for orders</p>}
              </div>
              <div className="flex flex-wrap gap-1.5" data-testid="batch-pills">
                {r.batches.length === 0 && <span className="text-xs text-muted">No batches</span>}
                {r.batches.map((b) => {
                  const warn = b.expiryDate && b.expiryDate <= soon
                  return (
                    <span key={b.id} className={cn('text-xs rounded-full px-2.5 py-1 border whitespace-nowrap', warn ? 'bg-[#FFFAEB] border-[#FEC84B] text-[#7A2E0E]' : 'bg-sand border-line text-ink')}>
                      {formatQty(b.qtyMilli, r.unit)} · {b.expiryDate ? `Exp: ${shortDate(b.expiryDate)}` : 'No expiry'}
                      {warn ? ' ⚠️' : ''}
                    </span>
                  )
                })}
              </div>
              <div className="text-xs text-ink/80">
                {latestBatchCost !== null ? <span>Cost: {formatSen(latestBatchCost)}/{r.unit}</span> : <span className="text-muted">No cost</span>}
                {r.sellPriceSen !== null && <span> · Sell: {formatSen(r.sellPriceSen)}</span>}
                {latestBatchCost !== null && r.sellPriceSen ? (
                  <span className="block text-muted">Margin {Math.round(((r.sellPriceSen - latestBatchCost) / r.sellPriceSen) * 100)}%</span>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setReceiveFor(r.id)} className="bg-ink text-paper rounded-lg px-3 min-h-[44px] text-xs font-semibold whitespace-nowrap" data-testid="row-receive">+ Receive</button>
                <button onClick={() => setAdjustFor(r.id)} className="border border-ink rounded-lg px-3 min-h-[44px] text-xs font-semibold whitespace-nowrap" data-testid="row-adjust">± Adjust</button>
              </div>
            </li>
          )
        })}
      </ul>

      {receiveFor !== undefined && (
        <ReceiveBatchDialog
          products={rows.map((r) => ({ id: r.id, name: r.name, code: r.code, unit: r.unit, category: r.category }))}
          initialProductId={receiveFor ?? undefined}
          suppliers={[...new Set(rows.flatMap((r) => r.batches.map((b) => b.supplierName)).filter((s): s is string => !!s))]}
          onClose={() => setReceiveFor(undefined)}
          onDone={() => {
            setReceiveFor(undefined)
            load()
          }}
        />
      )}
      {adjustRow && (
        <AdjustDialog
          product={{ id: adjustRow.id, name: adjustRow.name, code: adjustRow.code, unit: adjustRow.unit }}
          batches={adjustRow.batches.filter((b) => b.locationId === 'storeroom')}
          onHandMilli={adjustRow.onHandMilli}
          onClose={() => setAdjustFor(null)}
          onDone={() => {
            setAdjustFor(null)
            load()
          }}
        />
      )}
    </div>
  )
}
