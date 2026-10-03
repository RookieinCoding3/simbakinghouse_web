'use client'

import { useState } from 'react'

export interface LegalSection {
  heading: string
  body: string
}

export interface LegalDoc {
  title: string
  sections: LegalSection[]
}

interface LegalPageProps {
  lastUpdated: string
  en: LegalDoc
  bm: LegalDoc
}

// Shared by /privacy and /terms — EN/BM toggle, mobile-first (16px body
// text throughout, readable without zooming at 390px).
//
// Machine-translated into Bahasa Malaysia (not reviewed by a native legal
// translator). A Malaysian lawyer should review both the English and the
// Bahasa Malaysia text of both documents before this is relied on as an
// actual legal notice — simple consumer-facing wording was the goal here,
// not a vetted legal translation.
export default function LegalPage({ lastUpdated, en, bm }: LegalPageProps) {
  const [lang, setLang] = useState<'en' | 'bm'>('en')
  const doc = lang === 'en' ? en : bm

  return (
    <main className="min-h-screen bg-paper px-4 py-16 md:py-24">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-heading text-ink text-4xl md:text-5xl">{doc.title}</h1>
          <div
            role="group"
            aria-label="Language"
            className="flex border border-line shrink-0 text-sm mt-1"
          >
            <button
              type="button"
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
              className={`w-11 h-11 flex items-center justify-center transition-colors ${
                lang === 'en' ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('bm')}
              aria-pressed={lang === 'bm'}
              className={`w-11 h-11 flex items-center justify-center border-l border-line transition-colors ${
                lang === 'bm' ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'
              }`}
            >
              BM
            </button>
          </div>
        </div>

        <p className="text-base text-ink/60">
          {lang === 'en' ? 'Last updated' : 'Dikemas kini terakhir'}: {lastUpdated}
        </p>

        {doc.sections.map((section) => (
          <div key={section.heading} className="space-y-2">
            <h2 className="text-xs uppercase tracking-widest text-ink/70">{section.heading}</h2>
            <p className="text-base text-ink/80 leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
