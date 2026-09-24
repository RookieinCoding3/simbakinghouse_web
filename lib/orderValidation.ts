import { normalizeMyPhone } from '@/lib/phone'
import { SHOP_OPENS_AT, SHOP_CLOSES_AT } from '@/lib/site'
import type { OrderItem, Fulfilment } from '@/types/order'

export const MAX_ITEMS = 50
export const MAX_NAME_LENGTH = 100
export const MAX_ITEM_NAME_LENGTH = 200
export const MAX_NOTES_LENGTH = 500
export const MAX_QTY = 99

export interface ValidatedOrderInput {
  customerName: string
  customerPhone: string
  fulfilment: Fulfilment
  collectDate: string | null
  collectTime: string | null
  notes: string
  items: OrderItem[]
  estimatedTotal: number
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Parses a display string like "6:30 AM" (lib/site.ts's SHOP_OPENS_AT /
 *  SHOP_CLOSES_AT) into minutes-since-midnight, so shop hours are validated
 *  from that single source rather than a second hardcoded HH:MM pair. */
function displayTimeToMinutes(display: string): number {
  const match = display.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) throw new Error(`Unparseable shop hour: ${display}`)
  const [, hourStr, minuteStr, period] = match
  let hour = Number(hourStr) % 12
  if (period.toUpperCase() === 'PM') hour += 12
  return hour * 60 + Number(minuteStr)
}

const SHOP_OPENS_MINUTES = displayTimeToMinutes(SHOP_OPENS_AT)
const SHOP_CLOSES_MINUTES = displayTimeToMinutes(SHOP_CLOSES_AT)

function isWithinShopHours(time: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) return false
  const minutes = timeToMinutes(time)
  return minutes >= SHOP_OPENS_MINUTES && minutes <= SHOP_CLOSES_MINUTES
}

/**
 * Validates and normalises a raw checkout submission. Returns either
 * `{ ok: true, data }` or `{ ok: false, error }` with a message safe to
 * show the customer. Mirrors (and is stricter than) the isValidNewOrder
 * Firestore rule this project's Phase 5 plans, since orders are currently
 * written server-side via the Admin SDK rather than a client Firestore
 * write — see app/api/orders/route.ts.
 */
export function validateOrderInput(body: unknown): { ok: true; data: ValidatedOrderInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request' }
  const b = body as Record<string, unknown>

  const nameRaw = typeof b.customerName === 'string' ? b.customerName.trim() : ''
  if (!nameRaw || nameRaw.length > MAX_NAME_LENGTH) {
    return { ok: false, error: 'Enter your name' }
  }

  const phone = typeof b.customerPhone === 'string' ? normalizeMyPhone(b.customerPhone) : null
  if (!phone) {
    return { ok: false, error: 'Enter a valid Malaysian phone number' }
  }

  const fulfilment = b.fulfilment === 'delivery' ? 'delivery' : b.fulfilment === 'pickup' ? 'pickup' : null
  if (!fulfilment) {
    return { ok: false, error: 'Choose pickup or delivery' }
  }

  let collectDate: string | null = null
  if (typeof b.collectDate === 'string' && b.collectDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.collectDate)) {
      return { ok: false, error: 'Invalid collection date' }
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const chosen = new Date(`${b.collectDate}T00:00:00`)
    if (chosen.getTime() < today.getTime()) {
      return { ok: false, error: 'Choose a date from today onwards' }
    }
    collectDate = b.collectDate
  } else if (fulfilment === 'pickup') {
    return { ok: false, error: 'Choose a collection date' }
  }

  let collectTime: string | null = null
  if (typeof b.collectTime === 'string' && b.collectTime) {
    if (!isWithinShopHours(b.collectTime)) {
      return { ok: false, error: `Choose a time between ${SHOP_OPENS_AT} and ${SHOP_CLOSES_AT}` }
    }
    collectTime = b.collectTime
  } else {
    return { ok: false, error: 'Choose a collection time' }
  }

  const notes = typeof b.notes === 'string' ? b.notes.trim().slice(0, MAX_NOTES_LENGTH) : ''

  if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > MAX_ITEMS) {
    return { ok: false, error: 'Your cart is empty' }
  }

  const items: OrderItem[] = []
  for (const raw of b.items) {
    if (!raw || typeof raw !== 'object') return { ok: false, error: 'Invalid item in cart' }
    const item = raw as Record<string, unknown>
    const productId = typeof item.productId === 'string' ? item.productId : null
    const name = typeof item.name === 'string' ? item.name.slice(0, MAX_ITEM_NAME_LENGTH) : null
    const qty = typeof item.qty === 'number' && Number.isInteger(item.qty) ? item.qty : null
    const unitPriceSnapshot =
      item.unitPriceSnapshot === null
        ? null
        : typeof item.unitPriceSnapshot === 'number' && Number.isFinite(item.unitPriceSnapshot)
          ? item.unitPriceSnapshot
          : undefined

    if (!productId || !name || !qty || qty < 1 || qty > MAX_QTY || unitPriceSnapshot === undefined) {
      return { ok: false, error: 'Invalid item in cart' }
    }
    items.push({ productId, name, qty, unitPriceSnapshot })
  }

  const estimatedTotal = items.reduce(
    (sum, item) => sum + (item.unitPriceSnapshot ?? 0) * item.qty,
    0
  )

  return {
    ok: true,
    data: {
      customerName: nameRaw,
      customerPhone: phone,
      fulfilment,
      collectDate,
      collectTime,
      notes,
      items,
      estimatedTotal,
    },
  }
}
