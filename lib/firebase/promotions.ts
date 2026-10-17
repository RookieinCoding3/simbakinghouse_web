import { doc, getDoc } from 'firebase/firestore'
import { db } from './config'
import { parsePromotions } from '@/lib/promotions/validate'
import type { PromotionsDoc } from '@/lib/promotions/types'

/** settings/promotions (public read, like the rest of settings). Never
 *  throws: no promotions is a normal state. */
export async function fetchPromotions(): Promise<PromotionsDoc> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'promotions'))
    return parsePromotions(snap.exists() ? snap.data() : undefined)
  } catch {
    return { promos: [] }
  }
}
