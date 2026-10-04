import { getAdminDb } from './admin'

export interface ResolvedProduct {
  id: string
  name: string
  price: number
}

/**
 * Looks up the real price for each product ID server-side, via the Admin
 * SDK — the only price a created order is ever allowed to use. The client
 * sends a productId and qty; whatever price it also sends is read nowhere
 * in app/api/orders, deliberately, since a customer's own browser is not a
 * trustworthy source for what something costs.
 *
 * A product that doesn't exist, is soft-deleted, or has no price set
 * (price?: undefined — "Ask for price", not orderable via this flow) is
 * simply absent from the returned map; the caller treats a missing ID as
 * "reject the order", not as a fallback to anything the client provided.
 */
export async function resolveOrderItemPrices(productIds: string[]): Promise<Map<string, ResolvedProduct>> {
  const db = getAdminDb()
  const uniqueIds = Array.from(new Set(productIds))
  const results = new Map<string, ResolvedProduct>()

  await Promise.all(
    uniqueIds.map(async (id) => {
      const snap = await db.collection('products').doc(id).get()
      if (!snap.exists) return
      const data = snap.data() as Record<string, unknown>

      const isActive = data.isActive !== false
      const isDeleted = data.isDeleted === true
      if (!isActive || isDeleted) return

      const price = [data.price, data.Price, data.cost].find(
        (v): v is number => typeof v === 'number' && Number.isFinite(v)
      )
      if (price === undefined) return

      const name = [data.name, data.title, data.productName, data.Name].find(
        (v): v is string => typeof v === 'string' && v.length > 0
      )

      results.set(id, { id, name: name ?? 'Product', price })
    })
  )

  return results
}
