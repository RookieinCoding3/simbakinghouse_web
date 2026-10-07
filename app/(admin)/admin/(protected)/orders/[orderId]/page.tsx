'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { doc, onSnapshot, runTransaction, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { buildConfirmationMessage, buildAdminWhatsAppLink } from '@/lib/whatsapp'
import { useAdminSession } from '@/lib/admin/AdminSession'
import { recordReads } from '@/lib/admin/readMetrics'
import {
  normalizeOrder,
  formatRM,
  formatCollectDate,
  formatCollectTime,
  formatCreatedAt,
  type AdminOrder,
} from '@/lib/admin/normalizeOrder'
import type { OrderStatus } from '@/types/order'

function nowIso() {
  return new Date().toISOString()
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ orderId: string }>()
  const docId = decodeURIComponent(params.orderId)
  const { user } = useAdminSession()

  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const [confirmedTotalInput, setConfirmedTotalInput] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelForm, setShowCancelForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoadState('loading')
    return onSnapshot(
      doc(db, 'orders', docId),
      (snap) => {
        recordReads(1)
        if (!snap.exists()) {
          setLoadState('missing')
          return
        }
        const o = normalizeOrder(snap.id, snap.data())
        setOrder(o)
        // Don't prefill a total that leaves out "Ask for price" lines: the
        // owner has to type the real one.
        setConfirmedTotalInput((prev) =>
          prev === '' && o.estimatedTotal !== null && !o.priceToConfirm ? o.estimatedTotal.toFixed(2) : prev
        )
        setLoadState('ready')
      },
      () => setLoadState('error')
    )
  }, [docId, user, attempt])

  if (loadState === 'missing') return <p className="text-sm text-muted">Order not found.</p>
  if (loadState === 'error') {
    return (
      <div role="alert" className="py-12 text-center space-y-4">
        <p className="text-sm text-ink">Could not load this order.</p>
        <button onClick={() => setAttempt((a) => a + 1)} className="bg-ink text-paper text-xs uppercase tracking-widest px-5 py-3">
          Retry
        </button>
      </div>
    )
  }
  if (!order) {
    return (
      <div className="space-y-4 animate-pulse" aria-busy="true">
        <div className="h-8 w-40 bg-sand rounded" />
        <div className="h-24 bg-sand/70 rounded" />
        <div className="h-32 bg-sand/70 rounded" />
      </div>
    )
  }

  const updateStatus = async (status: OrderStatus, extra: Record<string, unknown> = {}) => {
    setBusy(true)
    setError(null)
    try {
      await updateDoc(doc(db, 'orders', docId), {
        status,
        updatedAt: nowIso(),
        statusHistory: [...order.statusHistory, { status, at: nowIso() }],
        ...extra,
      })
    } catch {
      setError('Could not update the order. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleAccept = async () => {
    const total = Number(confirmedTotalInput)
    if (confirmedTotalInput.trim() === '' || !Number.isFinite(total) || total < 0) {
      setError('Enter a valid total')
      return
    }
    await updateStatus('confirmed', { confirmedTotal: Math.round(total * 100) / 100 })
  }

  const handleMarkCollected = async () => {
    setBusy(true)
    setError(null)
    try {
      // Legacy per-product stockCount decrement, best-effort per item and
      // never blocking the status change.
      await Promise.all(
        order.items
          .filter((item) => item.productId)
          .map(async (item) => {
            const productRef = doc(db, 'products', item.productId)
            try {
              await runTransaction(db, async (tx) => {
                const snap = await tx.get(productRef)
                if (!snap.exists()) return
                const stockCount = snap.data().stockCount
                if (typeof stockCount !== 'number') return
                tx.update(productRef, { stockCount: Math.max(0, stockCount - item.qty) })
              })
            } catch {
              // A missing/renamed product shouldn't block marking collected.
            }
          })
      )
      await updateDoc(doc(db, 'orders', docId), {
        status: 'collected',
        updatedAt: nowIso(),
        statusHistory: [...order.statusHistory, { status: 'collected', at: nowIso() }],
      })
    } catch {
      setError('Could not update the order. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      setError('Enter a reason')
      return
    }
    await updateStatus('cancelled', { cancelReason: cancelReason.trim() })
    setShowCancelForm(false)
  }

  const confirmationWaLink =
    order.confirmedTotal !== null && order.customerPhone
      ? buildAdminWhatsAppLink(
          order.customerPhone,
          buildConfirmationMessage({
            orderId: order.orderId,
            name: order.customerName,
            confirmedTotal: order.confirmedTotal,
            collectDate: order.collectDate,
            collectTime: order.collectTime,
          })
        )
      : null

  const isFinal = order.status === 'collected' || order.status === 'cancelled'

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/admin" className="text-xs text-muted hover:text-ink">
        &larr; Back to orders
      </Link>

      <div>
        <p className="text-xs uppercase tracking-widest text-ink/50">{order.status ?? (order.rawStatus || 'no status')}</p>
        <h1 className="font-heading text-ink text-2xl md:text-3xl">{order.orderId}</h1>
        {order.createdAt && <p className="text-xs text-muted mt-1">Placed {formatCreatedAt(order.createdAt)}</p>}
      </div>

      {order.problems.length > 0 && (
        <p className="text-xs text-muted border border-line rounded px-3 py-2">
          This order was saved in an older format ({order.problems.join(', ')}). Shown as best as possible.
        </p>
      )}

      <div className="text-sm space-y-1">
        <p className="text-ink font-medium">{order.customerName}</p>
        {order.customerPhone && <p className="text-muted">{order.customerPhone}</p>}
        {order.fulfilment && <p className="text-muted">{order.fulfilment === 'pickup' ? 'Self pickup' : 'Delivery'}</p>}
        {(order.collectDate || order.collectTime) && (
          <p className="text-muted">
            {formatCollectDate(order.collectDate)} {formatCollectTime(order.collectTime)}
          </p>
        )}
        {order.notes && <p className="text-muted italic">&quot;{order.notes}&quot;</p>}
      </div>

      <div className="border-y border-line divide-y divide-line">
        {order.items.length === 0 && <p className="py-3 text-sm text-muted">No items recorded.</p>}
        {order.items.map((item, i) => (
          <div key={`${item.productId}-${i}`} className="flex justify-between gap-4 py-3 text-sm">
            <span className="text-ink">
              {item.qty} x {item.name}
            </span>
            <span className="text-muted whitespace-nowrap">
              {item.unitPrice !== null ? formatRM(item.unitPrice * item.qty) : 'Ask for price'}
            </span>
          </div>
        ))}
        <div className="flex justify-between py-3 text-sm font-medium">
          <span className="text-ink">Estimated total</span>
          <span className="text-ink">
            {formatRM(order.estimatedTotal)}
            {order.priceToConfirm && ' + price to confirm'}
          </span>
        </div>
        {order.confirmedTotal !== null && (
          <div className="flex justify-between py-3 text-sm font-medium">
            <span className="text-ink">Confirmed total</span>
            <span className="text-ink">{formatRM(order.confirmedTotal)}</span>
          </div>
        )}
      </div>

      {order.priceToConfirm && order.confirmedTotal === null && (
        <p data-testid="price-to-confirm" className="text-sm text-clay border border-clay/40 rounded px-3 py-2">
          Price to confirm: some items are &quot;Ask for price&quot; and are not in the estimated total. Set their
          price and enter the full final total before accepting.
        </p>
      )}

      {error && <p className="text-xs text-clay">{error}</p>}

      {order.status === 'new' && (
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-widest text-ink/70">
            Final total (RM)
            <input
              type="text"
              inputMode="decimal"
              value={confirmedTotalInput}
              onChange={(e) => setConfirmedTotalInput(e.target.value)}
              className="mt-2 w-full bg-white border border-line py-3 px-4 text-ink text-base focus:outline-none focus:border-ink/40"
            />
          </label>
          <button
            onClick={handleAccept}
            disabled={busy}
            className="w-full bg-ink hover:bg-clay disabled:opacity-50 text-paper py-4 font-medium text-xs uppercase tracking-[0.2em] transition-colors"
          >
            Accept
          </button>
        </div>
      )}

      {order.status === 'confirmed' && (
        <div className="space-y-3">
          {confirmationWaLink && (
            <a
              href={confirmationWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-ink hover:bg-clay text-paper py-4 font-medium text-xs uppercase tracking-[0.2em] transition-colors"
            >
              Send on WhatsApp
            </a>
          )}
          <button
            onClick={() => updateStatus('paid')}
            disabled={busy}
            className="w-full border border-ink text-ink py-4 font-medium text-xs uppercase tracking-[0.2em] disabled:opacity-50"
          >
            Mark paid
          </button>
        </div>
      )}

      {order.status === 'paid' && (
        <button
          onClick={() => updateStatus('ready')}
          disabled={busy}
          className="w-full bg-ink hover:bg-clay disabled:opacity-50 text-paper py-4 font-medium text-xs uppercase tracking-[0.2em] transition-colors"
        >
          Mark ready
        </button>
      )}

      {order.status === 'ready' && (
        <button
          onClick={handleMarkCollected}
          disabled={busy}
          className="w-full bg-ink hover:bg-clay disabled:opacity-50 text-paper py-4 font-medium text-xs uppercase tracking-[0.2em] transition-colors"
        >
          Mark collected
        </button>
      )}

      {isFinal && (
        <p className="text-xs text-muted">
          {order.status === 'collected' ? 'Collected.' : `Cancelled — ${order.cancelReason || 'no reason given'}`}
        </p>
      )}

      {!order.status && (
        <p className="text-xs text-muted">
          This order&apos;s status isn&apos;t one the admin recognises, so no actions are offered for it.
        </p>
      )}

      {order.status && !isFinal && (
        <div className="pt-4 border-t border-line">
          {!showCancelForm ? (
            <button onClick={() => setShowCancelForm(true)} className="text-xs uppercase tracking-widest text-clay hover:text-clay/80 py-2">
              Cancel order
            </button>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-widest text-ink/70">
                Reason
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="mt-2 w-full bg-white border border-line py-3 px-4 text-ink text-base focus:outline-none focus:border-ink/40"
                />
              </label>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={busy}
                  className="flex-1 bg-clay text-paper py-3 font-medium text-xs uppercase tracking-[0.2em] disabled:opacity-50"
                >
                  Confirm cancel
                </button>
                <button
                  onClick={() => setShowCancelForm(false)}
                  className="flex-1 border border-line text-ink py-3 font-medium text-xs uppercase tracking-[0.2em]"
                >
                  Never mind
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
