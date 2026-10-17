'use client'

import { cn } from '@/lib/utils/cn'
import { useLang } from '@/lib/i18n/LangContext'
import { useStorefrontSettings } from './StorefrontSettings'

/** "We speak English, Bahasa Melayu and 中文": only when switched on in Settings. */
export default function LanguageLine({ className }: { className?: string }) {
  const { t } = useLang()
  if (!useStorefrontSettings().showLanguageLine) return null
  return (
    <p className={cn('text-xs text-muted', className)} data-testid="language-line">
      {t('lang.line')}
    </p>
  )
}
