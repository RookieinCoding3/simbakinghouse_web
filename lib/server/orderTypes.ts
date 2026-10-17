import { getAdminDb } from '@/lib/firebase/admin'
import { DEFAULT_ORDER_TYPES, type OrderTypes } from '@/lib/orderValidation'

/**
 * Which order types the shop has switched on, set on the SBH Inventory iPad
 * (invSettings/app.orderTypes). invSettings is not public, so this reads it
 * with the Admin SDK. Missing doc or field = on, so the shop keeps taking
 * orders before the iPad is set up.
 */
export async function fetchOrderTypes(): Promise<OrderTypes> {
  try {
    const snap = await getAdminDb().collection('invSettings').doc('app').get()
    const t = snap.data()?.orderTypes as Partial<OrderTypes> | undefined
    return {
      pickup: t?.pickup !== false,
      courierPickup: t?.courierPickup !== false,
    }
  } catch {
    return DEFAULT_ORDER_TYPES
  }
}
