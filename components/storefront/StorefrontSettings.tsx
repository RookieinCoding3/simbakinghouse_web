'use client'

import { createContext, useContext } from 'react'
import { DEFAULT_SETTINGS, type ShopSettings } from '@/lib/firebase/settings'

export type StorefrontSettings = Pick<
  ShopSettings,
  'whatsappNumber' | 'openingHours' | 'chilledNoticeEn' | 'chilledNoticeZh' | 'showLanguageLine'
>

const Ctx = createContext<StorefrontSettings>(DEFAULT_SETTINGS)

/** Public shop settings for client components (fetched once by the layout). */
export function StorefrontSettingsProvider({ value, children }: { value: StorefrontSettings; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStorefrontSettings(): StorefrontSettings {
  return useContext(Ctx)
}

export function waLink(number: string, text?: string): string {
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}
