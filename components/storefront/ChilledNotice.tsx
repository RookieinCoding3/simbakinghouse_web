'use client'

import { cn } from '@/lib/utils/cn'
import { useLang } from '@/lib/i18n/LangContext'
import { useStorefrontSettings } from './StorefrontSettings'

/** The chilled-item notice; its text is a shop setting (EN + ZH). */
export default function ChilledNotice({ className, title }: { className?: string; title?: string }) {
  const { lang } = useLang()
  const s = useStorefrontSettings()
  return (
    <div className={cn('flex gap-2 items-start bg-[#EAF3F8] border border-[#C9DFEC] text-[#1F4A63] px-3 py-2 text-xs leading-relaxed', className)} data-testid="chilled-notice" role="note">
      <span aria-hidden="true">❄</span>
      <span>
        {title && <strong className="block font-semibold">{title}</strong>}
        {lang === 'zh' ? s.chilledNoticeZh : s.chilledNoticeEn}
      </span>
    </div>
  )
}
