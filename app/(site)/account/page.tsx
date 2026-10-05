'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import { useIsAdmin } from '@/lib/admin/useIsAdmin'
import { formatDate } from '@/lib/whatsapp'
import type { PublicOrderView, OrderStatus } from '@/types/order'

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'Order received',
  confirmed: 'Awaiting payment',
  paid: 'Packing your order',
  ready: 'Ready for collection',
  collected: 'Collected',
  cancelled: 'Cancelled',
}

export default function AccountPage() {
  const { user, loading, signOutUser } = useAuth()
  const { isAdmin } = useIsAdmin()
  const router = useRouter()
  const [orders, setOrders] = useState<PublicOrderView[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/')
    }
  }, [loading, user, router])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/orders/mine', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setError(json.error || 'Could not load your orders')
          return
        }
        setOrders(json.orders)
      } catch {
        if (!cancelled) setError('Could not load your orders')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  if (loading || !user) {
    return <main className="max-w-2xl mx-auto px-6 py-16" />
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <div className="flex items-start justify-between gap-4 mb-10">
        <div>
          <h1 className="font-heading text-ink text-4xl mb-1">Your account</h1>
          <p className="text-ink/60 text-sm">{user.email}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {isAdmin && (
            <Link
              href="/admin"
              className="text-xs uppercase tracking-widest text-clay hover:text-ink underline underline-offset-2 whitespace-nowrap"
            >
              Admin
            </Link>
          )}
          <button
            onClick={() => signOutUser()}
            className="text-xs uppercase tracking-widest text-ink/60 hover:text-ink underline underline-offset-2 whitespace-nowrap"
          >
            Sign out
          </button>
        </div>
      </div>

      <h2 className="text-xs uppercase tracking-widest text-ink/50 mb-4">Order history</h2>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && orders === null && <p className="text-sm text-ink/60">Loading…</p>}

      {orders !== null && orders.length === 0 && (
        <p className="text-sm text-ink/60">
          No orders yet — orders you place while signed in will show up here.
        </p>
      )}

      {orders !== null && orders.length > 0 && (
        <ul className="divide-y divide-line border-t border-b border-line">
          {orders.map((order) => (
            <li key={order.orderId} className="py-5 space-y-2">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-medium text-ink">{order.orderId}</span>
                <span className="text-xs uppercase tracking-wide text-ink/50">
                  {STATUS_LABEL[order.status]}
                </span>
              </div>
              <p className="text-xs text-ink/50">{formatDate(order.createdAt.slice(0, 10))}</p>
              <ul className="text-sm text-ink/70 space-y-0.5">
                {order.items.map((item) => (
                  <li key={item.productId}>
                    {item.qty} x {item.name}
                  </li>
                ))}
              </ul>
              <p className="text-sm font-medium text-ink">
                RM {(order.confirmedTotal ?? order.estimatedTotal).toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
