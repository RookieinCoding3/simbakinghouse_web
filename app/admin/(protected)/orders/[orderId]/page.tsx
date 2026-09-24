'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, onSnapshot, runTransaction, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { formatDate, formatTime, buildConfirmationMessage, buildAdminWhatsAppLink } from '@/lib/whatsapp'
import type { Order, OrderStatus, StatusHistoryEntry } from '@/types/order'
import type { Product } from '@/types/product'

function nowIso() {
  return new Date().toISOString()
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ orderId: string }>()
  const orderId = params.orderId
  const router = useRouter()

  const [order, setOrder] = useState<Order | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [confirmedTotalInput, setConfirmedTotalInput] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelForm, setShowCancelForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'orders', orderId),
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true)
          return
        }
        const data = snap.data() as Order
        setOrder(data)
        setConfirmedTotalInput((prev) => (prev === '' ? data.estimatedTotal.toFixed(2) : prev))
      },
      () => setNotFound(true)
    )
    return unsubscribe
  }, [orderId])

  if (notFound) return <p className="text-sm text-muted">Order not found.</p>
  if (!order) return <p className="text-sm text-muted">Loading…</p>

  const updateStatus = async (status: OrderStatus, extra: Record<string, unknown> = {}) => {
    setBusy(true)
    setError(null)
    try {
      const entry: StatusHistoryEntry = { status, at: nowIso() }
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: nowIso(),
        statusHistory: [...order.statusHistory, entry],
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
    if (!Number.isFinite(total) || total < 0) {
      setError('Enter a valid total')
      return
    }
    await updateStatus('confirmed', { confirmedTotal: total })
  }

  const handleMarkCollected = async () => {
    setBusy(true)
    setError(null)
    try {
      // Decrement stockCount for items that track it — best-effort per
      // product (not one giant transaction across every product doc,
      // since a single admin tapping "collected" doesn't need that level
      // of atomicity, and Firestore transactions cap at 500 docs anyway).
      // Never blocks the sale/status change on stock tracking being on.
      await Promise.all(
        order.items.map(async (item) => {
          const productRef = doc(db, 'products', item.productId)
          try {
            await runTransaction(db, async (tx) => {
              const snap = await tx.get(productRef)
              if (!snap.exists()) return
              const product = snap.data() as Product
              if (typeof product.stockCount !== 'number') return // tracking off
              tx.update(productRef, { stockCount: Math.max(0, product.stockCount - item.qty) })
            })
          } catch {
            // A missing/renamed product shouldn't block marking the order
            // collected — the owner can fix stock counts manually.
          }
        })
      )
      const entry: StatusHistoryEntry = { status: 'collected', at: nowIso() }
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'collected',
        updatedAt: nowIso(),
        statusHistory: [...order.statusHistory, entry],
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
    order.confirmedTotal !== null
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

  return (
    <div className="space-y-8">
      <button onClick={() => router.push('/admin')} className="text-xs text-muted hover:text-ink">
        &larr; Back to orders
      </button>

      <div>
        <p className="text-xs uppercase tracking-widest text-ink/50">{order.status}</p>
        <h1 className="font-heading text-ink text-3xl">{order.orderId}</h1>
      </div>

      <div className="text-sm space-y-1">
        <p className="text-ink font-medium">{order.customerName}</p>
        <p className="text-muted">{order.customerPhone}</p>
        <p className="text-muted">{order.fulfilment === 'pickup' ? 'Self pickup' : 'Delivery'}</p>
        {order.collectDate && (
          <p className="text-muted">
            {formatDate(order.collectDate)} {formatTime(order.collectTime)}
          </p>
        )}
        {order.notes && <p className="text-muted italic">&quot;{order.notes}&quot;</p>}
      </div>

      <div className="border-t border-b border-line divide-y divide-line">
        {order.items.map((item) => (
          <div key={item.productId} className="flex justify-between py-3 text-sm">
            <span className="text-ink">
              {item.qty} x {item.name}
            </span>
            <span className="text-muted">
              {item.unitPriceSnapshot !== null ? `RM ${(item.unitPriceSnapshot * item.qty).toFixed(2)}` : 'Ask for price'}
            </span>
          </div>
        ))}
        <div className="flex justify-between py-3 text-sm font-medium">
          <span className="text-ink">Estimated total</span>
          <span className="text-ink">RM {order.estimatedTotal.toFixed(2)}</span>
        </div>
        {order.confirmedTotal !== null && (
          <div className="flex justify-between py-3 text-sm font-medium">
            <span className="text-ink">Confirmed total</span>
            <span className="text-ink">RM {order.confirmedTotal.toFixed(2)}</span>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-clay">{error}</p>}

      {/* Actions per status */}
      {order.status === 'new' && (
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-widest text-ink/70">
            Final total (RM)
            <input
              type="number"
              step="0.01"
              min="0"
              value={confirmedTotalInput}
              onChange={(e) => setConfirmedTotalInput(e.target.value)}
              className="mt-2 w-full bg-white border border-line py-3 px-4 text-ink text-sm focus:outline-none focus:border-ink/40"
            />
          </label>
          <button
            onClick={handleAccept}
            disabled={busy}
            className="w-full bg-ink hover:bg-clay disabled:opacity-50 text-paper py-4 font-body font-medium text-xs uppercase tracking-[0.2em] transition-colors"
          >
            Accept
          </button>
        </div>
      )}

      {order.status === 'confirmed' && confirmationWaLink && (
        <div className="space-y-3">
          <a
            href={confirmationWaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-ink hover:bg-clay text-paper py-4 font-body font-medium text-xs uppercase tracking-[0.2em] transition-colors"
          >
            Send on WhatsApp
          </a>
          <button
            onClick={() => updateStatus('paid')}
            disabled={busy}
            className="w-full border border-ink text-ink py-4 font-body font-medium text-xs uppercase tracking-[0.2em] disabled:opacity-50"
          >
            Mark paid
          </button>
        </div>
      )}

      {order.status === 'paid' && (
        <button
          onClick={() => updateStatus('ready')}
          disabled={busy}
          className="w-full bg-ink hover:bg-clay disabled:opacity-50 text-paper py-4 font-body font-medium text-xs uppercase tracking-[0.2em] transition-colors"
        >
          Mark ready
        </button>
      )}

      {order.status === 'ready' && (
        <button
          onClick={handleMarkCollected}
          disabled={busy}
          className="w-full bg-ink hover:bg-clay disabled:opacity-50 text-paper py-4 font-body font-medium text-xs uppercase tracking-[0.2em] transition-colors"
        >
          Mark collected
        </button>
      )}

      {(order.status === 'collected' || order.status === 'cancelled') && (
        <p className="text-xs text-muted">
          {order.status === 'collected' ? 'Collected.' : `Cancelled — ${order.cancelReason || 'no reason given'}`}
        </p>
      )}

      {order.status !== 'collected' && order.status !== 'cancelled' && (
        <div className="pt-4 border-t border-line">
          {!showCancelForm ? (
            <button
              onClick={() => setShowCancelForm(true)}
              className="text-xs uppercase tracking-widest text-clay hover:text-clay/80"
            >
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
                  className="mt-2 w-full bg-white border border-line py-3 px-4 text-ink text-sm focus:outline-none focus:border-ink/40"
                />
              </label>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={busy}
                  className="flex-1 bg-clay text-paper py-3 font-body font-medium text-xs uppercase tracking-[0.2em] disabled:opacity-50"
                >
                  Confirm cancel
                </button>
                <button
                  onClick={() => setShowCancelForm(false)}
                  className="flex-1 border border-line text-ink py-3 font-body font-medium text-xs uppercase tracking-[0.2em]"
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
