'use client'

import { useLang } from '@/lib/i18n/LangContext'
import { useStorefrontSettings, waLink } from './StorefrontSettings'
import LanguageLine from './LanguageLine'

export function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2Zm5.8 14.03c-.25.69-1.45 1.32-2 1.36-.51.05-1 .24-3.37-.7-2.84-1.12-4.65-4.03-4.79-4.22-.14-.19-1.15-1.53-1.15-2.92 0-1.39.73-2.07.99-2.36.25-.28.55-.35.74-.35l.53.01c.17.01.4-.06.62.48.25.6.84 2.06.91 2.21.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.07 1.31 2.36 1.46.29.15.46.12.63-.07.17-.2.73-.85.92-1.14.19-.29.39-.24.65-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.12.07.69-.18 1.37Z" />
    </svg>
  )
}

/** Big "Ask Sim on WhatsApp" block, using the shop's WhatsApp number. */
export default function AskSimSection() {
  const { t } = useLang()
  const { whatsappNumber } = useStorefrontSettings()
  return (
    <section id="ask-sim" className="bg-sand border-y border-line" aria-labelledby="ask-sim-title" data-testid="ask-sim">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-14 md:py-20 grid md:grid-cols-[1fr_auto] gap-6 md:gap-12 items-center">
        <div className="space-y-3 max-w-2xl">
          <h2 id="ask-sim-title" className="font-heading text-3xl sm:text-4xl leading-tight text-ink">
            {t('ask.title')}
          </h2>
          <p className="text-sm text-ink/80 leading-relaxed">{t('ask.body')}</p>
          <LanguageLine />
        </div>
        <a
          href={waLink(whatsappNumber, t('ask.prefill'))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-3 bg-[#1F7A4D] hover:bg-[#186640] text-white px-7 py-4 text-sm font-semibold tracking-wide min-h-[52px]"
          data-testid="ask-sim-button"
        >
          <WhatsAppIcon />
          {t('ask.button')}
        </a>
      </div>
    </section>
  )
}
