'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { translate, type Lang, type StringKey } from './strings'

// The page is rendered in English on the server (cached pages, SEO); a
// visitor who picked 中文 gets it applied right after load, and the choice is
// remembered in this browser.
const STORAGE_KEY = 'sbh_lang'

interface LangValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: StringKey, vars?: Record<string, string | number>) => string
  /** A product/category name in the chosen language (falls back to English). */
  pick: (en: string, zh?: string | null) => string
}

const LangContext = createContext<LangValue | null>(null)

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'zh') setLangState('zh')
    } catch {
      // storage blocked (private mode): English
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en'
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      // not remembered, still switched
    }
  }, [])

  const value = useMemo<LangValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
      pick: (en, zh) => (lang === 'zh' && zh && zh.trim() ? zh : en),
    }),
    [lang, setLang],
  )
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

const FALLBACK: LangValue = {
  lang: 'en',
  setLang: () => {},
  t: (key, vars) => translate('en', key, vars),
  pick: (en) => en,
}

/** Outside the provider (e.g. admin pages) everything is English. */
export function useLang(): LangValue {
  return useContext(LangContext) ?? FALLBACK
}
