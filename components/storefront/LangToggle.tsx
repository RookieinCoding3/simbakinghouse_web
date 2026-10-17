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

/** Phone header: one small button that switches to the other language. */
export function LangSwitchCompact({ className }: { className?: string }) {
  const { lang, setLang } = useLang()
  const other = lang === 'zh' ? 'en' : 'zh'
  return (
    <button
      type="button"
      onClick={() => setLang(other)}
      lang={other === 'zh' ? 'zh-Hans' : 'en'}
      aria-label={other === 'zh' ? '切换到中文' : 'Switch to English'}
      className={cn('min-w-[40px] h-10 px-1.5 text-[12px] text-ink border border-line', className)}
      data-testid="lang-compact"
    >
      {other === 'zh' ? '中文' : 'EN'}
    </button>
  )
}
