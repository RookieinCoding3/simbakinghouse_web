'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { cn } from '@/lib/utils/cn'
import { useAdminSession } from '@/lib/admin/AdminSession'
import { recordReads } from '@/lib/admin/readMetrics'
import { testFault } from '@/lib/admin/testHooks'
import { loadCachedOrders, saveCachedOrders } from '@/lib/admin/ordersCache'
import {
  normalizeOrder,
  formatRM,
  formatCollectDate,
  formatCollectTime,
  type AdminOrder,
} from '@/lib/admin/normalizeOrder'
import type { OrderStatus } from '@/types/order'

const PAGE_SIZE = 50
const ACTIVE_STATUSES: OrderStatus[] = ['new', 'confirmed', 'paid', 'ready']

type TabKey = 'active' | OrderStatus | 'all'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'new', label: 'New' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'paid', label: 'Paid' },
  { key: 'ready', label: 'Ready' },
  { key: 'collected', label: 'Collected' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'all', label: 'All' },
]

const TAB_KEY = 'sbh-admin-orders-tab'

// Every one of these is covered by an index in firestore.indexes.json:
// status+createdAt (asc and desc) serves both `==` and `in`; "all" is a
// single-field orderBy (automatic index).
function constraintsFor(tab: TabKey): QueryConstraint[] {
  if (tab === 'all') return [orderBy('createdAt', 'desc')]
  // Active and New are work queues: oldest first, the order they came in.
  if (tab === 'active') return [where('status', 'in', ACTIVE_STATUSES), orderBy('createdAt', 'asc')]
  return [where('status', '==', tab), orderBy('createdAt', tab === 'new' ? 'asc' : 'desc')]
}

function readInitialTab(): TabKey {
  try {
    const t = sessionStorage.getItem(TAB_KEY) as TabKey | null
    if (t && TABS.some((x) => x.key === t)) return t
  } catch {}
  return 'active'
}

export default function AdminOrdersPage() {
  const { user } = useAdminSession()
  const [tab, setTab] = useState<TabKey>('active')
  const [livePage, setLivePage] = useState<{ orders: AdminOrder[]; last: QueryDocumentSnapshot | null; full: boolean }>({
    orders: [],
    last: null,
    full: false,
  })
  const [more, setMore] = useState<{ orders: AdminOrder[]; last: QueryDocumentSnapshot | null; full: boolean } | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  // True while showing the last-seen list from this device, before the live query answers.
  const [fromCache, setFromCache] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [moreError, setMoreError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => setTab(readInitialTab()), [])

  const selectTab = (t: TabKey) => {
    setTab(t)
    try {
      sessionStorage.setItem(TAB_KEY, t)
    } catch {}
  }

  // Paint the last-seen list for this tab straight away (before auth and
  // Firestore are even ready); the live query below replaces it.
  useEffect(() => {
    const cached = loadCachedOrders(tab)
    setMore(null)
    setMoreError(false)
    if (cached) {
      setLivePage({ orders: cached, last: null, full: false })
      setFromCache(true)
      setStatus('ready')
    } else {
      setLivePage({ orders: [], last: null, full: false })
      setFromCache(false)
      setStatus('loading')
    }
  }, [tab])

  useEffect(() => {
    if (!user) return

    if (testFault('orders-query')) {
      setFromCache(false)
      setStatus('error')
      return
    }

    // Live updates for the first page only — new orders appear without a
    // refresh; older pages are fetched once, on demand.
    const q = query(collection(db, 'orders'), ...constraintsFor(tab), limit(PAGE_SIZE))
    return onSnapshot(
      q,
      (snap) => {
        recordReads(snap.docChanges().length)
        const fresh = snap.docs.map((d) => normalizeOrder(d.id, d.data()))
        setLivePage({
          orders: fresh,
          last: snap.docs[snap.docs.length - 1] ?? null,
          full: snap.size === PAGE_SIZE,
        })
        setFromCache(false)
        setStatus('ready')
        saveCachedOrders(tab, fresh)
      },
      () => {
        setFromCache(false)
        setStatus('error')
      }
    )
  }, [tab, user, attempt])

  const loadMore = useCallback(async () => {
    const cursor = more?.last ?? livePage.last
    if (!cursor) return
    setLoadingMore(true)
    setMoreError(false)
    try {
      const snap = await getDocs(query(collection(db, 'orders'), ...constraintsFor(tab), startAfter(cursor), limit(PAGE_SIZE)))
      recordReads(snap.size)
      setMore((prev) => ({
        orders: [...(prev?.orders ?? []), ...snap.docs.map((d) => normalizeOrder(d.id, d.data()))],
        last: snap.docs[snap.docs.length - 1] ?? prev?.last ?? null,
        full: snap.size === PAGE_SIZE,
      }))
    } catch {
      setMoreError(true)
    } finally {
      setLoadingMore(false)
    }
  }, [more, livePage.last, tab])

  const orders = useMemo(() => {
    const seen = new Set<string>()
    return [...livePage.orders, ...(more?.orders ?? [])].filter((o) => (seen.has(o.docId) ? false : (seen.add(o.docId), true)))
  }, [livePage.orders, more])

  const hasMore = !fromCache && (more ? more.full : livePage.full)
  const showStatusChip = tab === 'active' || tab === 'all'

  if (testFault('render-orders')) throw new Error('test fault: orders render')

  return (
    <div>
      <h1 className="font-heading text-ink text-2xl md:text-3xl mb-4">Orders</h1>

      <div className="-mx-4 px-4 mb-5 overflow-x-auto" role="tablist" aria-label="Order status">
        <div className="flex gap-2 w-max">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => selectTab(t.key)}
              className={cn(
                'px-3.5 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
                tab === t.key ? 'bg-ink text-paper' : 'bg-sand text-ink/70 hover:text-ink'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {fromCache && (
        <p className="text-[11px] text-muted mb-2" aria-live="polite">
          Updating…
        </p>
      )}

      {status === 'loading' && <OrderListSkeleton />}

      {status === 'error' && (
        <div role="alert" className="py-12 text-center space-y-4">
          <p className="text-sm text-ink">Could not load orders.</p>
          <button
            onClick={() => setAttempt((a) => a + 1)}
            className="bg-ink text-paper text-xs uppercase tracking-widest px-5 py-3"
          >
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && orders.length === 0 && <p className="text-sm text-muted py-8">No orders here.</p>}

      {status === 'ready' && orders.length > 0 && (
        <ul className="divide-y divide-line border-y border-line" data-testid="order-list">
          {orders.map((order) => (
            <li key={order.docId}>
              <Link
                href={`/admin/orders/${encodeURIComponent(order.docId)}`}
                prefetch={false}
                data-order-id={order.orderId}
                className="flex items-center justify-between gap-3 py-3.5 px-2 -mx-2 hover:bg-sand transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink flex items-center gap-2 flex-wrap">
                    {order.orderId}
                    {showStatusChip && <StatusChip order={order} />}
                    {order.problems.length > 0 && (
                      <span className="text-[10px] uppercase tracking-wide text-muted border border-line px-1.5 rounded" title={order.problems.join(', ')}>
                        old data
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted mt-0.5 truncate">
                    {order.customerName} · {order.itemCount} item{order.itemCount === 1 ? '' : 's'}
                  </p>
                  {(order.collectDate || order.collectTime) && (
                    <p className="text-xs text-muted">
                      {formatCollectDate(order.collectDate)} {formatCollectTime(order.collectTime)}
                    </p>
                  )}
                </div>
                <p className="text-sm text-ink font-medium whitespace-nowrap">
                  {formatRM(order.confirmedTotal ?? order.estimatedTotal)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {status === 'ready' && hasMore && (
        <div className="py-6 text-center">
          {moreError && <p className="text-xs text-clay mb-2">Could not load more. Try again.</p>}
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="border border-ink text-ink text-xs uppercase tracking-widest px-6 py-3 disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  new: 'bg-clay text-paper',
  confirmed: 'bg-amber-100 text-amber-900',
  paid: 'bg-emerald-100 text-emerald-900',
  ready: 'bg-sky-100 text-sky-900',
  collected: 'bg-sand text-muted',
  cancelled: 'bg-sand text-muted line-through',
}

function StatusChip({ order }: { order: AdminOrder }) {
  const label = order.status ?? (order.rawStatus || 'no status')
  return (
    <span
      className={cn(
        'text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded',
        order.status ? STATUS_STYLE[order.status] : 'border border-clay text-clay'
      )}
    >
      {label}
    </span>
  )
}

function OrderListSkeleton() {
  return (
    <ul className="divide-y divide-line border-y border-line animate-pulse" aria-busy="true" aria-label="Loading orders">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex justify-between py-4">
          <div className="space-y-2">
            <div className="h-3.5 w-24 bg-sand rounded" />
            <div className="h-3 w-40 bg-sand/70 rounded" />
          </div>
          <div className="h-3.5 w-16 bg-sand rounded" />
        </li>
      ))}
    </ul>
  )
}
