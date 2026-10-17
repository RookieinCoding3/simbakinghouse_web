'use client'

import { cn } from '@/lib/utils/cn'
import { useLang } from '@/lib/i18n/LangContext'

export default function LangToggle({ className }: { className?: string }) {
  const { lang, setLang, t } = useLang()
  return (
    <div role="group" aria-label={t('lang.switch')} className={cn('inline-flex border border-line text-[11px]', className)} data-testid="lang-toggle">
      {(
        [
          ['en', 'EN'],
          ['zh', '中文'],
        ] as const
      ).map(([code, label]) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={cn('min-w-[44px] min-h-[36px] px-2 tracking-wider', lang === code ? 'bg-ink text-paper' : 'text-ink hover:bg-sand')}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
