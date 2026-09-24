import { CONTACT_WHATSAPP_URL, absoluteUrl } from '@/lib/site'
import type { OrderItem } from '@/types/order'

// wa.me links break on very long text, so once the order has more than this
// many line items the message drops the itemised list and points at the
// order link instead.
const MAX_ITEMS_IN_MESSAGE = 8

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'To be arranged'
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return dateStr
  return new Date(year, month - 1, day).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(timeStr: string | null): string {
  if (!timeStr) return 'To be arranged'
  const [hourStr, minuteStr] = timeStr.split(':')
  const hour = Number(hourStr)
  const minute = Number(minuteStr)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return timeStr
  const period = hour < 12 ? 'AM' : 'PM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`
}

interface OrderMessageInput {
  orderId: string
  name: string
  collectDate: string | null
  collectTime: string | null
  items: OrderItem[]
  estimatedTotal: number
}

export function buildOrderMessage({
  orderId,
  name,
  collectDate,
  collectTime,
  items,
  estimatedTotal,
}: OrderMessageInput): string {
  const itemsBlock =
    items.length > MAX_ITEMS_IN_MESSAGE
      ? 'See order link below'
      : items
          .map((item) => `${item.qty} x ${item.name}`)
          .join('\n')

  return [
    "Hi Sim Baking House, I'd like to order.",
    '',
    `Order: ${orderId}`,
    `Name: ${name}`,
    `Collect: ${formatDate(collectDate)} ${formatTime(collectTime)}`,
    '',
    itemsBlock,
    '',
    `Estimated total: RM ${estimatedTotal.toFixed(2)}`,
    '',
    `Link: ${absoluteUrl(`/order/${orderId}`)}`,
  ].join('\n')
}

/** whatsappUrl defaults to the static CONTACT_WHATSAPP_URL but should
 *  normally be built from the live settings/shop WhatsApp number (see
 *  lib/firebase/settings.ts) so a changed number takes effect immediately. */
export function buildOrderWhatsAppLink(
  input: OrderMessageInput,
  whatsappUrl: string = CONTACT_WHATSAPP_URL
): string {
  return `${whatsappUrl}?text=${encodeURIComponent(buildOrderMessage(input))}`
}

interface ConfirmationMessageInput {
  orderId: string
  name: string
  confirmedTotal: number
  collectDate: string | null
  collectTime: string | null
}

/** The message admin sends after tapping Accept — see TASK.md Phase 4.1.
 *  Nothing here auto-sends; this only builds a wa.me link admin taps. */
export function buildConfirmationMessage({
  orderId,
  name,
  confirmedTotal,
  collectDate,
  collectTime,
}: ConfirmationMessageInput): string {
  return [
    `Hi ${name}, your order ${orderId} is confirmed.`,
    `Total: RM ${confirmedTotal.toFixed(2)}`,
    `Pay here: ${absoluteUrl(`/order/${orderId}`)}`,
    `Collect: ${formatDate(collectDate)} ${formatTime(collectTime)}`,
  ].join('\n')
}

/** customerPhone is the full 60XXXXXXXXX number — admin reads the raw
 *  order doc (Firestore rule: isAdmin() only), unlike the customer-facing
 *  status page which only ever sees phoneLast4. */
export function buildAdminWhatsAppLink(customerPhone: string, message: string): string {
  return `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`
}
