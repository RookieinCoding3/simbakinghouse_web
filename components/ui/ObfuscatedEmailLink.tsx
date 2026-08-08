'use client'

import { useEffect, useState, type ReactNode } from 'react'

// Split and only assembled client-side after mount, so the address never
// appears as a literal string in server-rendered HTML (where simple
// scrapers look) or as one contiguous string in the JS bundle.
const EMAIL_USER = 'simbakinghouse25'
const EMAIL_DOMAIN = 'gmail.com'

interface ObfuscatedEmailLinkProps {
  className?: string
  children: ReactNode
}

export default function ObfuscatedEmailLink({ className, children }: ObfuscatedEmailLinkProps) {
  const [mailto, setMailto] = useState<string | null>(null)

  useEffect(() => {
    setMailto(`mailto:${EMAIL_USER}@${EMAIL_DOMAIN}`)
  }, [])

  return (
    <a
      href={mailto ?? '#'}
      className={className}
      onClick={(e) => {
        // Covers the brief pre-hydration window and keeps this a real,
        // always-focusable link rather than one that only works after JS
        // has had a chance to run.
        if (!mailto) {
          e.preventDefault()
          window.location.href = `mailto:${EMAIL_USER}@${EMAIL_DOMAIN}`
        }
      }}
    >
      {children}
    </a>
  )
}
