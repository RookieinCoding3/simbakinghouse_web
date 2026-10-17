'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminSession } from '@/lib/admin/AdminSession'
import { adminFetch, AdminApiError } from '@/lib/admin/api'
import { buildAdminWhatsAppLink, buildConfirmationMessage } from '@/lib/whatsapp'
import { formatCollectDate, formatCollectTime } from '@/lib/admin/normalizeOrder'
import { formatSen } from '@/lib/money'
import { formatQty } from '@/lib/inventory/units'
import { cn } from '@/lib/utils/cn'
import { PageSkeleton, notifyAdminChanged } from '@/components/admin/AdminShell'
import { ReceiveBatchDialog, type PickProduct } from '@/components/admin/StockDialogs'

interface QueueOrder {
  docId: string
  orderId: string
  status: string
  customerName: string
  customerPhone: string
  collectDate: string | null
  collectTime: string | null
  fulfilment: string | null
  estimatedTotalSen: number
  confirmedTotalSen: number | null
  priceToConfirm: boolean
  items: { qty: number; name: string; size: string | null }[]
}

interface Dashboard {
  today: string
  stats: { actionNeeded: number; revenueSen: number; revenueOrders: number; expiringBatches: number; lowOrOut: number }
  queue: QueueOrder[]
  expiring: { productId: string; name: string; unit: string; chilled: boolean; totalMilli: number; batchId: string; qtyMilli: number; expiryDate: string; supplierName: string | null }[]
  low: { productId: string; name: string; unit: string; availableMilli: number; lowAtMilli: number; out: boolean }[]
  products: PickProduct[]
}

const STATUS_LABEL: Record<string, string> = { new: 'New', confirmed: 'Confirmed', awaiting_payment: 'Awaiting payment', paid: 'Paid', ready: 'Ready' }
const STATUS_STYLE: Record<string, string> = {
  new: 'bg-[#B42318] text-white',
  confirmed: 'bg-amber-100 text-amber-900',
  awaiting_payment: 'bg-amber-100 text-amber-900',
  paid: 'bg-emerald-100 text-emerald-900',
  ready: 'bg-sky-100 text-sky-900',
}

/** "05 Nov" from YYYY-MM-DD. */
function shortDate(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })
}
function daysUntil(day: string, today: string) {
  return Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000)
}

export default function AdminDashboard() {
  const { user } = useAdminSession()
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [receiveFor, setReceiveFor] = useState<string | null | undefined>(undefined) // undefined = closed, null = choose product
  const [busy, setBusy] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(() => {
    adminFetch<Dashboard>('/api/admin/dashboard')
      .then((d) => {
        setData(d)
        setError(null)
      })
      .catch((e) => setError(e instanceof AdminApiError ? e.message : 'Could not load the dashboard.'))
  }, [])

  useEffect(() => {
    if (!user) return
    load()
    const t = setInterval(load, 30_000)
    window.addEventListener('sbh-admin-changed', load)
    return () => {
      clearInterval(t)
      window.removeEventListener('sbh-admin-changed', load)
    }
  }, [user, load])

  const step = async (o: QueueOrder, to: string, extra: Record<string, unknown> = {}) => {
    setBusy(o.docId)
    setActionError(null)
    try {
      await adminFetch(`/api/admin/orders/${encodeURIComponent(o.docId)}/transition`, { method: 'POST', body: JSON.stringify({ to, ...extra }) })
      notifyAdminChanged()
      return true
    } catch (e) {
      setActionError(`${o.orderId}: ${e instanceof AdminApiError ? e.message : 'could not update. Try again.'}`)
      return false
    } finally {
      setBusy(null)
    }
  }

  /** Confirm at the estimated total, then open the customer's WhatsApp
   *  with the confirmation (window opened on the tap so it isn't blocked). */
  const confirmAndWhatsApp = async (o: QueueOrder) => {
    const win = window.open('', '_blank')
    const ok = await step(o, 'confirmed', { confirmedTotalSen: o.estimatedTotalSen })
    if (!ok || !o.customerPhone) {
      win?.close()
      return
    }
    const link = buildAdminWhatsAppLink(
      o.customerPhone,
      buildConfirmationMessage({ orderId: o.orderId, name: o.customerName, confirmedTotal: o.estimatedTotalSen / 100, collectDate: o.collectDate, collectTime: o.collectTime }),
    )
    if (win) win.location.href = link
    else window.location.href = link
  }

  if (error && !data) {
    return (
      <div role="alert" className="py-12 text-center space-y-4">
        <p className="text-sm text-ink">{error}</p>
        <button onClick={load} className="bg-ink text-paper text-xs uppercase tracking-widest px-5 py-3">Retry</button>
      </div>
    )
  }
  if (!data) return <PageSkeleton />
  const { stats } = data

  const card = (labelText: string, value: string, sub: string, href: string, tone: string, testId: string) => (
    <Link href={href} prefetch={false} className={cn('rounded-2xl border p-4 md:p-5 min-h-[112px] flex flex-col justify-between hover:shadow-sm transition-shadow', tone)} data-testid={testId}>
      <p className="text-[11px] uppercase tracking-widest font-semibold opacity-80">{labelText}</p>
      <p className="font-heading text-3xl md:text-4xl leading-none mt-2">{value}</p>
      <p className="text-xs opacity-75 mt-1">{sub}</p>
    </Link>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-ink text-2xl md:text-3xl">Today</h1>
        <button onClick={() => setReceiveFor(null)} className="bg-ink text-paper rounded-xl px-5 min-h-[48px] text-sm font-semibold" data-testid="receive-delivery">
          + Receive stock delivery
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {card('Action needed', String(stats.actionNeeded), 'new + paid, ready to pack', '/admin/orders', stats.actionNeeded ? 'bg-[#FEF3F2] border-[#FDA29B] text-[#7A271A]' : 'bg-white border-line text-ink', 'stat-action')}
        {card("Today's confirmed", formatSen(stats.revenueSen), `${stats.revenueOrders} order${stats.revenueOrders === 1 ? '' : 's'}`, '/admin/orders', 'bg-white border-line text-ink', 'stat-revenue')}
        {card('Expiring ≤ 14 days', String(stats.expiringBatches), 'batches · tap to review', '/admin/stock?filter=expiring', stats.expiringBatches ? 'bg-[#FFFAEB] border-[#FEC84B] text-[#7A2E0E]' : 'bg-white border-line text-ink', 'stat-expiring')}
        {card('Out / low stock', String(stats.lowOrOut), 'products below their level', '/admin/stock?filter=low', stats.lowOrOut ? 'bg-[#FFFAEB] border-[#FEC84B] text-[#7A2E0E]' : 'bg-white border-line text-ink', 'stat-low')}
      </div>

      {actionError && <p role="alert" className="text-sm text-clay">{actionError}</p>}

      <div className="grid lg:grid-cols-[3fr_2fr] gap-6 items-start">
        <section aria-labelledby="queue-title" className="space-y-3" data-testid="fulfilment-queue">
          <div className="flex items-center justify-between">
            <h2 id="queue-title" className="text-sm font-semibold text-ink">Live fulfilment queue</h2>
            <Link href="/admin/orders" className="text-xs underline text-ink/70">All orders</Link>
          </div>
          {data.queue.length === 0 && <p className="text-sm text-muted bg-white border border-line rounded-2xl p-5">No open orders. 🎉</p>}
          {data.queue.map((o) => (
            <article key={o.docId} className="bg-white border border-line rounded-2xl p-4 space-y-3" data-testid="queue-order">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink flex items-center gap-2 flex-wrap">
                    <Link href={`/admin/orders/${encodeURIComponent(o.docId)}`} className="underline-offset-2 hover:underline">{o.orderId}</Link>
                    <span className={cn('text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded', STATUS_STYLE[o.status] ?? 'bg-sand')}>{STATUS_LABEL[o.status] ?? o.status}</span>
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {o.customerName}
                    {(o.collectDate || o.collectTime) && ` · ${formatCollectDate(o.collectDate)} ${formatCollectTime(o.collectTime)}`}
                    {o.fulfilment === 'courier_pickup' && ' · courier'}
                  </p>
                </div>
                <p className="text-sm font-semibold text-ink whitespace-nowrap">
                  {formatSen(o.confirmedTotalSen ?? o.estimatedTotalSen)}
                  {o.priceToConfirm && o.confirmedTotalSen === null && <span className="block text-[10px] uppercase text-clay text-right">+ to price</span>}
                </p>
              </div>
              <ul className="text-sm text-ink/85 space-y-0.5">
                {o.items.map((i, k) => (
                  <li key={k}>
                    {i.qty}× {i.name}
                    {i.size && <span className="text-muted"> · {i.size}</span>}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                {o.status === 'new' && !o.priceToConfirm && (
                  <button disabled={busy === o.docId} onClick={() => confirmAndWhatsApp(o)} className="bg-[#1F7A4D] text-white rounded-lg px-4 min-h-[48px] text-sm font-semibold disabled:opacity-50" data-testid="queue-confirm">
                    Confirm & WhatsApp
                  </button>
                )}
                {o.status === 'new' && o.priceToConfirm && (
                  <Link href={`/admin/orders/${encodeURIComponent(o.docId)}`} className="bg-ink text-paper rounded-lg px-4 min-h-[48px] inline-flex items-center text-sm font-semibold">
                    Price & confirm
                  </Link>
                )}
                {(o.status === 'confirmed' || o.status === 'awaiting_payment') && (
                  <button disabled={busy === o.docId} onClick={() => step(o, 'paid')} className="border border-ink text-ink rounded-lg px-4 min-h-[48px] text-sm font-semibold disabled:opacity-50" data-testid="queue-paid">
                    Mark paid
                  </button>
                )}
                {o.status === 'paid' && (
                  <button disabled={busy === o.docId} onClick={() => step(o, 'ready')} className="bg-ink text-paper rounded-lg px-4 min-h-[48px] text-sm font-semibold disabled:opacity-50" data-testid="queue-ready">
                    Mark ready
                  </button>
                )}
                {o.status === 'ready' && (
                  <button disabled={busy === o.docId} onClick={() => step(o, 'collected')} className="bg-ink text-paper rounded-lg px-4 min-h-[48px] text-sm font-semibold disabled:opacity-50" data-testid="queue-collected">
                    Collected
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>

        <aside className="space-y-6">
          <section aria-labelledby="exp-title" className="bg-white border border-line rounded-2xl p-4" data-testid="expiring-list">
            <h2 id="exp-title" className="text-sm font-semibold text-ink mb-3">Expiring soon</h2>
            {data.expiring.length === 0 ? (
              <p className="text-sm text-muted">Nothing expires in the next 14 days.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.expiring.slice(0, 8).map((b) => {
                  const d = daysUntil(b.expiryDate, data.today)
                  return (
                    <li key={b.batchId} className="py-2.5 text-sm flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-ink truncate">{b.chilled ? '❄️ ' : ''}{b.name}</span>
                        <span className="block text-xs text-muted">
                          ⚠️ {formatQty(b.qtyMilli, b.unit)} expiring {shortDate(b.expiryDate)} ({formatQty(b.totalMilli, b.unit)} total)
                          {b.supplierName && ` · ${b.supplierName}`}
                        </span>
                      </span>
                      <span className={cn('text-xs font-semibold whitespace-nowrap', d <= 3 ? 'text-[#B42318]' : 'text-[#B54708]')}>{d < 0 ? 'expired' : d === 0 ? 'today' : `${d}d`}</span>
                    </li>
                  )
                })}
              </ul>
            )}
            <Link href="/admin/promos" className="mt-3 inline-block text-xs underline text-ink/70">Put on clearance →</Link>
          </section>

          <section aria-labelledby="low-title" className="bg-white border border-line rounded-2xl p-4" data-testid="low-list">
            <h2 id="low-title" className="text-sm font-semibold text-ink mb-3">Low stock</h2>
            {data.low.length === 0 ? (
              <p className="text-sm text-muted">Nothing below its level.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.low.slice(0, 8).map((r) => (
                  <li key={r.productId} className="py-2 flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block text-ink truncate">{r.name}</span>
                      <span className={cn('block text-xs', r.out ? 'text-[#B42318]' : 'text-[#B54708]')}>
                        {r.out ? '🔴 Out' : `🟡 ${formatQty(r.availableMilli, r.unit)} left`}
                      </span>
                    </span>
                    <button onClick={() => setReceiveFor(r.productId)} className="border border-ink rounded-lg px-3 min-h-[44px] text-xs font-semibold whitespace-nowrap">
                      Receive
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {receiveFor !== undefined && (
        <ReceiveBatchDialog
          products={data.products}
          initialProductId={receiveFor ?? undefined}
          suppliers={[...new Set(data.expiring.map((e) => e.supplierName).filter((s): s is string => !!s))]}
          onClose={() => setReceiveFor(undefined)}
          onDone={() => {
            setReceiveFor(undefined)
            load()
          }}
        />
      )}
    </div>
  )
}
