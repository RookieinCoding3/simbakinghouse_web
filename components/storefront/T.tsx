'use client'

import { useLang } from '@/lib/i18n/LangContext'
import type { StringKey } from '@/lib/i18n/strings'

/** Translated text for Server Components (English in the server HTML). */
export default function T({ k, vars }: { k: StringKey; vars?: Record<string, string | number> }) {
  const { t } = useLang()
  return <>{t(k, vars)}</>
}
