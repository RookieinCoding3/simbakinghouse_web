'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { formatDate, formatTime } from '@/lib/whatsapp'
import { cn } from '@/lib/utils/cn'
import type { Order, OrderStatus } from '@/types/order'

const TABS: { label: string; status: OrderStatus | 'all' }[] = [
  { label: 'New', status: 'new' },
  { label: 'Confirmed', status: 'confirmed' },
  { label: 'Paid', status: 'paid' },
  { label: 'Ready', status: 'ready' },
  { label: 'Collected', status: 'collected' },
  { label: 'Cancelled', status: 'cancelled' },
  { label: 'All', status: 'all' },
]

export default function AdminOrdersPage() {
  const [tab, setTab] = useState<OrderStatus | 'all'>('new')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    // Oldest-first for the default 'new' queue (the spec: work through it
    // in the order it came in); newest-first everywhere else, since that's
    // more useful once you're just browsing history.
    const constraints =
      tab === 'all'
        ? [orderBy('createdAt', 'desc')]
        : [where('status', '==', tab), orderBy('createdAt', tab === 'new' ? 'asc' : 'desc')]
    const q = query(collection(db, 'orders'), ...constraints)

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setOrders(snap.docs.map((d) => d.data() as Order))
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsubscribe
  }, [tab])

  return (
    <div>
      <h1 className="font-heading text-ink text-3xl mb-6">Orders</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.status}
            onClick={() => setTab(t.status)}
            className={cn(
              'px-3 py-1.5 text-[11px] uppercase tracking-widest font-medium transition-colors',
              tab === t.status ? 'bg-ink text-paper' : 'bg-sand text-ink/70 hover:text-ink'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted">Loading…</p>}

      {!loading && orders.length === 0 && <p className="text-sm text-muted">No orders here.</p>}

      <div className="divide-y divide-line border-t border-b border-line">
        {orders.map((order) => (
          <Link
            key={order.orderId}
            href={`/admin/orders/${order.orderId}`}
            className="flex items-center justify-between py-4 hover:bg-sand transition-colors px-2 -mx-2"
          >
            <div>
              <p className="text-sm font-medium text-ink">{order.orderId}</p>
              <p className="text-xs text-muted mt-0.5">
                {order.customerName} · {order.items.reduce((n, i) => n + i.qty, 0)} item
                {order.items.reduce((n, i) => n + i.qty, 0) === 1 ? '' : 's'}
              </p>
              {order.collectDate && (
                <p className="text-xs text-muted">
                  {formatDate(order.collectDate)} {formatTime(order.collectTime)}
                </p>
              )}
            </div>
            <p className="text-sm text-ink font-medium whitespace-nowrap">
              RM {order.estimatedTotal.toFixed(2)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
