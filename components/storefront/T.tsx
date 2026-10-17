'use client'

import { useLang } from '@/lib/i18n/LangContext'
import { localizeHours, type StringKey } from '@/lib/i18n/strings'

/** Translated text for Server Components (English in the server HTML). */
export default function T({ k, vars }: { k: StringKey; vars?: Record<string, string | number> }) {
  const { t, lang } = useLang()
  const v = vars && typeof vars.hours === 'string' ? { ...vars, hours: localizeHours(lang, vars.hours) } : vars
  return <>{t(k, v)}</>
}
