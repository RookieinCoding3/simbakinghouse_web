'use client'

import { useEffect } from 'react'
import { initAppCheck } from '@/lib/firebase/appCheck'

/** Mounted once in the root layout. Renders nothing — just fires the
 *  client-only App Check init (a no-op until NEXT_PUBLIC_RECAPTCHA_SITE_KEY
 *  is set, see lib/firebase/appCheck.ts). */
export default function AppCheckInit() {
  useEffect(() => {
    initAppCheck()
  }, [])
  return null
}
