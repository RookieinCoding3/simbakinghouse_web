'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { buildOrderWhatsAppLink, formatDate, formatTime } from '@/lib/whatsapp'
import type { PublicOrderView } from '@/types/order'
import { useLang } from '@/lib/i18n/LangContext'
import { localizeHours } from '@/lib/i18n/strings'
import { useStorefrontSettings, waLink } from '@/components/storefront/StorefrontSettings'
import { WhatsAppIcon } from '@/components/storefront/AskSimSection'
import ChilledNotice from '@/components/storefront/ChilledNotice'

function sessionKey(orderId: string) {
  return `sbh_order_access_${orderId}`
}

function useAskLink() {
  const { whatsappNumber } = useStorefrontSettings()
  return (orderId: string) => waLink(whatsappNumber, `Hi, I have a question about order ${orderId}.`)
}

/** What checkout saved for this order in this browser (see checkout page). */
interface Handoff {
  waLink: string
  estimatedTotal: number
  priceToConfirm: boolean
  chilled: boolean
}
function readHandoff(orderId: string): Handoff | null {
  try {
    const raw = sessionStorage.getItem(`sbh_order_wa_${orderId}`)
    return raw ? (JSON.parse(raw) as Handoff) : null
  } catch {
    return null
  }
}

export default function OrderStatusPage() {
  const params = useParams<{ orderId: string }>()
  const orderId = params.orderId

  const [last4Input, setLast4Input] = useState('')
  const [order, setOrder] = useState<PublicOrderView | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsLast4, setNeedsLast4] = useState(false)
  const { t } = useLang()
  const askWhatsAppLink = useAskLink()

  const fetchOrder = async (last4: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orders/${orderId}?last4=${last4}`)
      if (!res.ok) {
        setError('Order not found. Check the order ID and the last 4 digits of your phone number.')
        setNeedsLast4(true)
        return
      }
      const data = (await res.json()) as PublicOrderView
      setOrder(data)
      setNeedsLast4(false)
      try {
        sessionStorage.setItem(sessionKey(orderId), JSON.stringify({ last4 }))
      } catch {
        // Non-fatal — just means re-entering the digits next visit.
      }
    } catch {
      setError('Something went wrong loading this order.')
      setNeedsLast4(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(sessionKey(orderId))
      if (raw) {
        const { last4 } = JSON.parse(raw) as { last4: string }
        if (/^\d{4}$/.test(last4)) {
          fetchOrder(last4)
          return
        }
      }
    } catch {
      // Fall through to asking for the digits.
    }
    setNeedsLast4(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const handleLast4Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{4}$/.test(last4Input)) {
      setError('Enter the 4 digits of your phone number')
      return
    }
    fetchOrder(last4Input)
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-16 md:py-24">
      <div className="max-w-lg mx-auto">
        <p className="text-xs uppercase tracking-widest text-ink/50 mb-2">{t('order.label')}</p>
        <h1 className="font-heading text-ink text-4xl md:text-5xl mb-10">{orderId}</h1>

        {loading && <p className="text-sm text-muted">Loading…</p>}

        {!order && needsLast4 && !loading && (
          <form onSubmit={handleLast4Submit} className="space-y-4">
            <label htmlFor="last4" className="block text-xs uppercase tracking-widest text-ink/70">
              Last 4 digits of your phone number
            </label>
            <input
              id="last4"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={last4Input}
              onChange={(e) => setLast4Input(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-white border border-line py-3 px-4 text-ink text-sm focus:outline-none focus:border-ink/40"
            />
            {error && <p className="text-xs text-clay">{error}</p>}
            <button
              type="submit"
              className="bg-ink hover:bg-clay text-paper py-3 px-8 font-body font-medium text-xs uppercase tracking-[0.2em] transition-colors"
            >
              View order
            </button>
            <p className="text-xs text-muted pt-2">
              Trouble finding your order?{' '}
              <a href={askWhatsAppLink(orderId)} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">
                Ask on WhatsApp
              </a>
              .
            </p>
          </form>
        )}

        {order && <OrderStatusView order={order} />}
      </div>
    </main>
  )
}

function OrderStatusView({ order }: { order: PublicOrderView }) {
  const { t } = useLang()
  return (
    <div className="space-y-8">
      <StatusMessage order={order} />

      <div className="border-t border-b border-line divide-y divide-line">
        {order.items.map((item) => (
          <div key={item.productId} className="flex justify-between py-3 text-sm">
            <span className="text-ink">
              {item.qty} x {item.name}
            </span>
            <span className="text-muted">
              {item.unitPriceSnapshot !== null ? `RM ${(item.unitPriceSnapshot * item.qty).toFixed(2)}` : t('product.askPrice')}
            </span>
          </div>
        ))}
      </div>

      <div className="text-sm text-muted space-y-1">
        {order.collectDate && <p>{t('order.collect')}: {formatDate(order.collectDate)}</p>}
        {order.collectTime && <p>{t('order.time')}: {formatTime(order.collectTime)}</p>}
        <p>
          {t('order.fulfilment')}:{' '}
          {order.fulfilment === 'pickup' ? t('order.pickup') : order.fulfilment === 'courier_pickup' ? t('order.courier') : 'Delivery'}
        </p>
      </div>
    </div>
  )
}

/** A new order: the WhatsApp message is what reaches Sim, so make sending
 *  it (again) the main thing on the page, with the total and next steps. */
function NewOrderNextSteps({ order }: { order: PublicOrderView }) {
  const { t, lang } = useLang()
  const { whatsappNumber, openingHours } = useStorefrontSettings()
  const [handoff, setHandoff] = useState<Handoff | null>(null)
  useEffect(() => setHandoff(readHandoff(order.orderId)), [order.orderId])
  const link =
    handoff?.waLink ??
    buildOrderWhatsAppLink(
      {
        orderId: order.orderId,
        name: '',
        collectDate: order.collectDate,
        collectTime: order.collectTime,
        items: order.items.map((i) => ({ productId: i.productId, name: i.name, qty: i.qty, unitPriceSnapshot: i.unitPriceSnapshot })),
        estimatedTotal: order.estimatedTotal,
        priceToConfirm: order.items.some((i) => i.unitPriceSnapshot === null),
        baseUrl: typeof window === 'undefined' ? undefined : window.location.origin,
      },
      `https://wa.me/${whatsappNumber}`,
    )
  const priceToConfirm = handoff?.priceToConfirm ?? order.items.some((i) => i.unitPriceSnapshot === null)
  return (
    <div className="space-y-5" data-testid="order-next-steps">
      <p className="text-sm text-ink">{t('order.received')}</p>
      <div className="border border-[#1F7A4D]/30 bg-[#EEF7F1] p-5 space-y-3">
        <h2 className="text-base font-semibold text-ink">{t('order.sendTitle')}</h2>
        <p className="text-sm text-ink/80">{t('order.sendBody')}</p>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 bg-[#1F7A4D] hover:bg-[#186640] text-white px-6 py-4 text-sm font-semibold min-h-[52px]"
          data-testid="order-send-whatsapp"
        >
          <WhatsAppIcon />
          {t('order.sendButton')}
        </a>
      </div>
      <p className="text-sm text-ink" data-testid="order-est-total">
        {t('order.estTotal')}: <span className="font-semibold">RM {order.estimatedTotal.toFixed(2)}</span>
        {priceToConfirm && <span className="text-muted"> {t('order.plusAsk')}</span>}
      </p>
      {handoff?.chilled && <ChilledNotice />}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-ink/70 mb-2">{t('order.next')}</h3>
        <ol className="list-decimal pl-5 space-y-1 text-sm text-ink/85">
          <li>{t('order.next1')}</li>
          <li>{t('order.next2')}</li>
          {order.collectDate && order.collectTime && (
            <li>{t('order.next3', { date: formatDate(order.collectDate), time: formatTime(order.collectTime) })}</li>
          )}
        </ol>
        <p className="text-xs text-muted mt-3">{t('order.noReply', { hours: localizeHours(lang, openingHours) })}</p>
      </div>
    </div>
  )
}

function StatusMessage({ order }: { order: PublicOrderView }) {
  const askWhatsAppLink = useAskLink()
  switch (order.status) {
    case 'new':
      return <NewOrderNextSteps order={order} />
    case 'confirmed':
    case 'awaiting_payment':
      return (
        <div className="space-y-3">
          <p className="text-sm text-ink">
            Total: <span className="font-medium">RM {(order.confirmedTotal ?? order.estimatedTotal).toFixed(2)}</span>
          </p>
          <p className="text-sm text-ink">Pay and send the receipt on WhatsApp.</p>
          {order.duitNowQrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- a short-lived signed URL, not a static asset next/image can optimise
            <img src={order.duitNowQrUrl} alt="DuitNow payment QR" className="w-48 h-48 border border-line" />
          ) : (
            <p className="text-xs text-muted">Sim will send the DuitNow QR directly on WhatsApp.</p>
          )}
          <a
            href={askWhatsAppLink(order.orderId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-ink hover:bg-clay text-paper py-3 px-8 font-body font-medium text-xs uppercase tracking-[0.2em] transition-colors"
          >
            Open WhatsApp
          </a>
        </div>
      )
    case 'paid':
      return <p className="text-sm text-ink">Payment received. We&apos;re packing your order.</p>
    case 'ready':
      return (
        <div className="space-y-1">
          <p className="text-sm text-ink">Ready for collection.</p>
          {order.collectTime && <p className="text-sm text-muted">Collection time: {formatTime(order.collectTime)}</p>}
        </div>
      )
    case 'collected':
      return <p className="text-sm text-ink">Collected. Thank you!</p>
    case 'cancelled':
      return (
        <div className="space-y-3">
          <p className="text-sm text-ink">Order cancelled.</p>
          {order.cancelReason && <p className="text-sm text-muted">{order.cancelReason}</p>}
          <a
            href={askWhatsAppLink(order.orderId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block underline text-sm text-clay hover:text-clay/80"
          >
            Ask about this on WhatsApp
          </a>
        </div>
      )
  }
}
