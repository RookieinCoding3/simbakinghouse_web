'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart/CartContext'
import { useAuth } from '@/lib/auth/AuthContext'
import { normalizeMyPhone } from '@/lib/phone'
import { buildOrderWhatsAppLink } from '@/lib/whatsapp'
import { fetchShopSettings, DEFAULT_SETTINGS } from '@/lib/firebase/settings'
import { getAppCheckToken } from '@/lib/firebase/appCheck'
import type { Fulfilment } from '@/types/order'

function toDateInputValue(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** "6:30 AM" -> "06:30", for the <input type="time"> min/max attributes. */
function displayTimeTo24h(display: string): string {
  const match = display.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return display
  const [, hourStr, minute, period] = match
  let hour = Number(hourStr) % 12
  if (period.toUpperCase() === 'PM') hour += 12
  return `${String(hour).padStart(2, '0')}:${minute}`
}

/** The native time picker's own min/max constrain the value on submit in
 *  most browsers, but Safari's picker UI (the one actually shown to most
 *  of our customers) lets you scroll to any hour/minute regardless — it
 *  only flags the value as invalid afterward, with no visible feedback as
 *  you pick. This checks the same range ourselves so we can show that
 *  feedback immediately instead of waiting for a server round-trip. */
function isTimeWithinRange(time: string, min: string, max: string): boolean {
  return time >= min && time <= max
}

export default function CheckoutPage() {
  const { items, subtotal, hasUnpricedItems, clear } = useCart()
  const { user } = useAuth()
  const router = useRouter()

  // Starts from the static defaults (no loading flash / flicker), then
  // refreshed from settings/shop on mount so a changed opening hours or
  // WhatsApp number takes effect without a deploy.
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  useEffect(() => {
    fetchShopSettings().then(setSettings)
  }, [])
  const timeMin = useMemo(() => displayTimeTo24h(settings.shopOpensAt), [settings.shopOpensAt])
  const timeMax = useMemo(() => displayTimeTo24h(settings.shopClosesAt), [settings.shopClosesAt])

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [fulfilment, setFulfilment] = useState<Fulfilment>('pickup')
  const [collectDate, setCollectDate] = useState('')
  const [collectTime, setCollectTime] = useState('')
  const [timeError, setTimeError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Hidden from real users and screen readers — a bot that fills every
  // field it finds trips this. See lib/botDefense.ts.
  const [honeypot, setHoneypot] = useState('')
  // Issued by the server when this page mounts, signed, and echoed back
  // unchanged on submit — proves at least 3 real seconds passed using the
  // server's own clock, not anything this page could claim on its own.
  // See lib/checkoutToken.ts.
  const [formToken, setFormToken] = useState<{ issuedAt: number; token: string } | null>(null)
  useEffect(() => {
    fetch('/api/checkout/token')
      .then((r) => r.json())
      .then(setFormToken)
      .catch(() => {})
  }, [])

  const minDate = useMemo(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return toDateInputValue(tomorrow)
  }, [])

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-ink text-4xl mb-4">Your cart is empty</h1>
          <p className="font-body text-ink/70 text-sm mb-8">Add something from our products before checking out.</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-4 bg-ink hover:bg-clay text-paper font-body font-medium uppercase tracking-widest text-xs transition-colors"
          >
            Browse products
          </Link>
        </div>
      </main>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setTimeError(null)

    const normalizedPhone = normalizeMyPhone(phone)
    if (!name.trim()) return setError('Enter your name')
    if (!normalizedPhone) return setError('Enter a valid Malaysian phone number')
    if (fulfilment === 'pickup' && !collectDate) return setError('Choose a collection date')
    if (!collectTime) return setError('Choose a collection time')
    if (!isTimeWithinRange(collectTime, timeMin, timeMax)) {
      return setTimeError(`Choose a time between ${settings.shopOpensAt} and ${settings.shopClosesAt}`)
    }
    if (!consent) return setError('Please agree to the storage of your details to continue')

    setSubmitting(true)
    try {
      const appCheckToken = await getAppCheckToken()
      // Optional — attaches the order to the signed-in account's order
      // history (app/account). Guest checkout (no user) is unaffected.
      const idToken = user ? await user.getIdToken() : null
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(appCheckToken && { 'X-Firebase-AppCheck': appCheckToken }),
          ...(idToken && { Authorization: `Bearer ${idToken}` }),
        },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: normalizedPhone,
          fulfilment,
          collectDate: fulfilment === 'pickup' ? collectDate : collectDate || null,
          collectTime,
          notes,
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            qty: item.qty,
          })),
          company: honeypot,
          formIssuedAt: formToken?.issuedAt ?? null,
          formToken: formToken?.token ?? null,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Something went wrong, please try again')
        setSubmitting(false)
        return
      }

      const { orderId, estimatedTotal, priceToConfirm } = json as {
        orderId: string
        estimatedTotal: number
        priceToConfirm?: boolean
      }

      try {
        sessionStorage.setItem(
          `sbh_order_access_${orderId}`,
          JSON.stringify({ last4: normalizedPhone.slice(-4) })
        )
      } catch {
        // Session storage unavailable — the customer will just be asked
        // for the last 4 digits again on the status page.
      }

      const waLink = buildOrderWhatsAppLink({
        orderId,
        name: name.trim(),
        collectDate: fulfilment === 'pickup' ? collectDate : collectDate || null,
        collectTime,
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          qty: item.qty,
          unitPriceSnapshot: item.unitPrice,
        })),
        estimatedTotal,
        priceToConfirm: priceToConfirm === true,
      }, `https://wa.me/${settings.whatsappNumber}`)

      clear()
      window.open(waLink, '_blank', 'noopener,noreferrer')
      router.push(`/order/${orderId}`)
    } catch {
      setError('Something went wrong, please try again')
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-16 md:py-24">
      <div className="max-w-xl mx-auto">
        <h1 className="font-heading text-ink text-4xl md:text-5xl mb-10">Checkout</h1>

        {/* Order summary */}
        <div className="mb-10 border-t border-b border-line divide-y divide-line">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between py-4 text-sm">
              <span className="text-ink">
                {item.qty} x {item.name}
              </span>
              <span className="text-muted">
                {item.unitPrice !== null ? `RM ${(item.unitPrice * item.qty).toFixed(2)}` : 'Ask for price'}
              </span>
            </div>
          ))}
          <div className="flex justify-between py-4 text-sm font-medium">
            <span className="text-ink">Subtotal</span>
            <span className="text-ink">RM {subtotal.toFixed(2)}</span>
          </div>
        </div>
        {hasUnpricedItems && (
          <p className="text-xs text-muted -mt-6 mb-10">
            Some items are priced on request — the total above doesn&apos;t include them yet.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div aria-hidden="true" className="absolute left-[-9999px] w-px h-px overflow-hidden">
            <label htmlFor="company">Company</label>
            <input
              id="company"
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              className="w-full bg-white border border-line py-3 px-4 text-ink text-sm focus:outline-none focus:border-ink/40"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="012-345 6789"
              required
              className="w-full bg-white border border-line py-3 px-4 text-ink text-sm focus:outline-none focus:border-ink/40"
            />
          </div>

          <div>
            <span className="block text-xs uppercase tracking-widest text-ink/70 mb-2">Fulfilment</span>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="radio"
                  name="fulfilment"
                  checked={fulfilment === 'pickup'}
                  onChange={() => setFulfilment('pickup')}
                />
                Self pickup
              </label>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="radio"
                  name="fulfilment"
                  checked={fulfilment === 'delivery'}
                  onChange={() => setFulfilment('delivery')}
                />
                Delivery — we&apos;ll quote you the fee
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="collectDate" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
                {fulfilment === 'pickup' ? 'Collection date' : 'Preferred date'}
              </label>
              <input
                id="collectDate"
                type="date"
                value={collectDate}
                onChange={(e) => setCollectDate(e.target.value)}
                min={minDate}
                required={fulfilment === 'pickup'}
                className="w-full bg-white border border-line py-3 px-4 text-ink text-sm focus:outline-none focus:border-ink/40"
              />
            </div>
            <div>
              <label htmlFor="collectTime" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
                Collection time
              </label>
              <input
                id="collectTime"
                type="time"
                value={collectTime}
                onChange={(e) => {
                  const value = e.target.value
                  setCollectTime(value)
                  // Safari's native time picker doesn't restrict which
                  // hour/minute you can scroll to based on min/max (Chrome
                  // does) — it only marks the value invalid afterward, so
                  // check the range ourselves and say something right away
                  // instead of only finding out from the server.
                  setTimeError(
                    value && !isTimeWithinRange(value, timeMin, timeMax)
                      ? `Choose a time between ${settings.shopOpensAt} and ${settings.shopClosesAt}`
                      : null
                  )
                }}
                min={timeMin}
                max={timeMax}
                required
                aria-invalid={timeError ? true : undefined}
                aria-describedby="collectTime-hint"
                className={`w-full bg-white border py-3 px-4 text-ink text-sm focus:outline-none ${
                  timeError ? 'border-red-400 focus:border-red-500' : 'border-line focus:border-ink/40'
                }`}
              />
              <p
                id="collectTime-hint"
                className={`text-[11px] mt-1 ${timeError ? 'text-red-600' : 'text-muted'}`}
              >
                {timeError ?? `Between ${settings.shopOpensAt} and ${settings.shopClosesAt}`}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-xs uppercase tracking-widest text-ink/70 mb-2">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full bg-white border border-line py-3 px-4 text-ink text-sm focus:outline-none focus:border-ink/40"
            />
          </div>

          <label className="flex items-start gap-3 text-base text-muted">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5"
              required
            />
            <span>
              I agree to the{' '}
              <Link href="/privacy" prefetch={false} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">
                Privacy Notice
              </Link>{' '}
              and{' '}
              <Link href="/terms" prefetch={false} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">
                Terms of Sale
              </Link>
              .
            </span>
          </label>

          {error && <p className="text-xs text-clay">{error}</p>}

          <p className="text-xs text-muted">
            We&apos;ll confirm stock and send a payment QR on WhatsApp. No payment needed yet.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-ink hover:bg-clay disabled:opacity-50 text-paper py-4 font-body font-medium text-xs uppercase tracking-[0.2em] transition-colors"
          >
            {submitting ? 'Sending…' : 'Send order on WhatsApp'}
          </button>
        </form>
      </div>
    </main>
  )
}
