import type { Order, PublicOrderView } from '@/types/order'

/** Deliberately narrow: never the full phone number, internal notes aside
 *  from the customer's own, or anything else beyond what a customer-facing
 *  view needs to render. Shared by the phone+last4 lookup (app/api/orders/
 *  [orderId]) and the signed-in order history list (app/api/orders/mine). */
export function toPublicOrderView(order: Order): PublicOrderView {
  return {
    orderId: order.orderId,
    status: order.status,
    fulfilment: order.fulfilment,
    collectDate: order.collectDate,
    collectTime: order.collectTime,
    items: order.items,
    estimatedTotal: order.estimatedTotal,
    priceToConfirm: order.priceToConfirm === true,
    confirmedTotal: order.confirmedTotal,
    cancelReason: order.cancelReason,
    createdAt: order.createdAt,
  }
}
