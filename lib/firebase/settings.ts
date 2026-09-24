import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './config'
import {
  OPENING_HOURS as DEFAULT_OPENING_HOURS,
  SHOP_OPENS_AT as DEFAULT_SHOP_OPENS_AT,
  SHOP_CLOSES_AT as DEFAULT_SHOP_CLOSES_AT,
  CONTACT_PHONE_NUMBER as DEFAULT_WHATSAPP_NUMBER,
} from '@/lib/site'

export interface ShopSettings {
  shopOpensAt: string // display, e.g. "6:30 AM"
  shopClosesAt: string // display, e.g. "1:00 PM"
  openingHours: string // e.g. "Daily: 6:30 AM - 1:00 PM"
  whatsappNumber: string // 60XXXXXXXXX
  /** Storage path (not a URL — the file isn't public), or null if none uploaded yet. */
  duitNowQrPath: string | null
}

export const DEFAULT_SETTINGS: ShopSettings = {
  shopOpensAt: DEFAULT_SHOP_OPENS_AT,
  shopClosesAt: DEFAULT_SHOP_CLOSES_AT,
  openingHours: DEFAULT_OPENING_HOURS,
  whatsappNumber: DEFAULT_WHATSAPP_NUMBER,
  duitNowQrPath: null,
}

const SETTINGS_DOC = doc(db, 'settings', 'shop')

/**
 * Reads settings/shop, the live source of truth for hours/WhatsApp/QR once
 * the owner has saved it once in /admin/settings. Falls back to the
 * lib/site.ts constants — used both server-side (this is the same public
 * client SDK fetchProducts() already uses from a Server Component) and
 * client-side. Never throws: a settings-read failure should never break a
 * page that just needs to show opening hours.
 */
export async function fetchShopSettings(): Promise<ShopSettings> {
  try {
    const snap = await getDoc(SETTINGS_DOC)
    if (!snap.exists()) return DEFAULT_SETTINGS
    const data = snap.data()
    return {
      shopOpensAt: typeof data.shopOpensAt === 'string' ? data.shopOpensAt : DEFAULT_SETTINGS.shopOpensAt,
      shopClosesAt: typeof data.shopClosesAt === 'string' ? data.shopClosesAt : DEFAULT_SETTINGS.shopClosesAt,
      openingHours: typeof data.openingHours === 'string' ? data.openingHours : DEFAULT_SETTINGS.openingHours,
      whatsappNumber: typeof data.whatsappNumber === 'string' ? data.whatsappNumber : DEFAULT_SETTINGS.whatsappNumber,
      duitNowQrPath: typeof data.duitNowQrPath === 'string' ? data.duitNowQrPath : null,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

/** Admin-only write (settings/{id} Firestore rule requires isAdmin()). */
export async function saveShopSettings(settings: Omit<ShopSettings, 'duitNowQrPath'> & { duitNowQrPath?: string | null }) {
  await setDoc(SETTINGS_DOC, settings, { merge: true })
}
