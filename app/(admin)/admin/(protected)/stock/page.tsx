'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { useAdminSession } from '@/lib/admin/AdminSession'
import { useAdminProducts } from '@/lib/admin/productsStore'
import { inventoryStore, draftsStore } from '@/lib/admin/collectionStore'
import { buildStockRows, daysAgo, type StockRow } from '@/lib/admin/stockView'
import { formatQty } from '@/lib/inventory/units'

type Filter = 'all' | 'managed' | 'low' | 'out' | 'recount' | 'unmanaged'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'managed', label: 'Managed' },
  { key: 'low', label: 'Low' },
  { key: 'out', label: 'Out' },
  { key: 'recount', label: 'Needs recount' },
  { key: 'unmanaged', label: 'Not managed' },
]

export default function StockPage() {
  const { user } = useAdminSession()
  const { products } = useAdminProducts(!!user)
  const inventory = inventoryStore.use(!!user)
  const drafts = draftsStore.use(!!user)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const rows = useMemo(
    () => (products ? buildStockRows(products, inventory.docs, drafts.docs) : null),
    [products, inventory.docs, drafts.docs]
  )
  const runningLow = useMemo(
    () => (rows ?? []).filter((r) => r.label === 'Low' || r.label === 'Out').sort((a, b) => a.availableMilli - b.availableMilli),
    [rows]
  )
  const managedCount = rows?.filter((r) => r.managed).length ?? 0

  const visible = useMemo(() => {
    if (!rows) return []
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (q && !r.product.name.toLowerCase().includes(q) && !r.product.category.toLowerCase().includes(q) && !r.product.barcodes.some((b) => b.includes(q))) return false
      switch (filter) {
        case 'managed': return r.managed
        case 'low': return r.label === 'Low'
        case 'out': return r.label === 'Out'
        case 'recount': return r.needsRecount
        case 'unmanaged': return !r.managed
        default: return true
      }
    })
  }, [rows, filter, search])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-ink text-2xl md:text-3xl">Stock</h1>
          {rows && (
            <p className="text-xs text-muted mt-1">
              {managedCount} of {rows.length} products managed here
            </p>
          )}
        </div>
        <Link href="/admin/sale" prefetch={false} className="bg-clay text-paper text-xs uppercase tracking-widest font-medium px-4 py-2.5 whitespace-nowrap">
          Quick sale
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link href="/admin/stock/count" prefetch={false} className="border border-line bg-white px-3 py-3 text-sm">
          <span className="block font-medium text-ink">Count stock</span>
          <span className="block text-xs text-muted">Walk the shelves, fix the numbers</span>
        </Link>
        <Link href="/admin/stock/switch" prefetch={false} className="border border-line bg-white px-3 py-3 text-sm">
          <span className="block font-medium text-ink">Switch over</span>
          <span className="block text-xs text-muted">Manage a category here</span>
        </Link>
      </div>

      {runningLow.length > 0 && (
        <section aria-labelledby="running-low" className="border border-clay/30 bg-clay/5 rounded p-4">
          <h2 id="running-low" className="text-sm font-semibold text-clay mb-2">
            Running low ({runningLow.length})
          </h2>
          <ul className="space-y-1.5">
            {runningLow.map((r) => (
              <li key={r.product.id}>
                <Link href={`/admin/stock/${r.product.id}`} prefetch={false} className="flex justify-between gap-3 text-sm">
                  <span className="truncate text-ink">{r.product.name}</span>
                  <span className={cn('whitespace-nowrap font-medium', r.label === 'Out' ? 'text-clay' : 'text-amber-800')}>
                    {r.label === 'Out' ? 'Out' : `${formatQty(r.availableMilli, r.product.config.baseUnit)} left`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="space-y-3">
        <input
          type="search"
          id="stock-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, category or barcode"
          className="w-full bg-white border border-line py-3 px-4 text-base focus:outline-none focus:border-ink/40"
        />
        <div className="-mx-4 px-4 overflow-x-auto">
          <div className="flex gap-2 w-max" role="tablist" aria-label="Filter">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={cn('px-3.5 py-2 text-xs font-medium rounded-full whitespace-nowrap', filter === f.key ? 'bg-ink text-paper' : 'bg-sand text-ink/70')}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!rows && (
        <div className="space-y-3 animate-pulse" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-sand/70 rounded" />
          ))}
        </div>
      )}

      {rows && visible.length === 0 && <p className="text-sm text-muted py-6">Nothing here.</p>}

      {rows && visible.length > 0 && (
        <ul className="divide-y divide-line border-y border-line" data-testid="stock-list">
          {visible.map((r) => (
            <StockListRow key={r.product.id} row={r} />
          ))}
        </ul>
      )}
    </div>
  )
}

const LABEL_STYLE = { OK: 'bg-emerald-100 text-emerald-900', Low: 'bg-amber-100 text-amber-900', Out: 'bg-clay text-paper' } as const

function StockListRow({ row }: { row: StockRow }) {
  const unit = row.product.config.baseUnit
  return (
    <li>
      <Link href={`/admin/stock/${row.product.id}`} prefetch={false} className="flex items-center justify-between gap-3 py-3" data-product-id={row.product.id}>
        <div className="min-w-0">
          <p className="text-sm text-ink truncate">{row.product.name}</p>
          {row.managed ? (
            <p className="text-xs text-muted tabular-nums">
              {formatQty(row.onHandMilli, unit)} on hand
              {row.reservedMilli > 0 && ` · ${formatQty(row.reservedMilli, unit)} held`} · {formatQty(row.availableMilli, unit)} available
            </p>
          ) : (
            <p className="text-xs text-muted">
              Not managed here{row.draft && ` · counted ${formatQty(row.draft.countedMilli, unit)}, ready to switch`}
            </p>
          )}
          {row.managed && (
            <p className={cn('text-[11px]', row.needsRecount ? 'text-amber-800' : 'text-muted')}>
              Last counted {daysAgo(row.lastCountedAt)}
              {row.needsRecount && ' · needs recount'}
            </p>
          )}
        </div>
        {row.label && <span className={cn('text-[10px] uppercase tracking-wide px-2 py-1 rounded font-medium', LABEL_STYLE[row.label])}>{row.label}</span>}
      </Link>
    </li>
  )
}
