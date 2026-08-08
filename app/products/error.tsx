'use client'

import { useEffect } from 'react'
import { CONTACT_WHATSAPP_URL } from '@/lib/config/contact'

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Products page failed to load:', error)
  }, [error])

  return (
    <main className="min-h-screen bg-bakery-dark pt-20 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-heading text-bakery-cream text-3xl mb-4 tracking-wide">
          COULDN&apos;T LOAD OUR PRODUCTS
        </h1>
        <p className="font-body text-bakery-cream/70 text-base mb-8">
          Something went wrong fetching our catalog. Sorry about that — message us
          on WhatsApp and we&apos;ll help you find what you need directly.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={CONTACT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-heading tracking-widest text-sm transition-colors rounded-full"
          >
            WHATSAPP US
          </a>
          <button
            onClick={reset}
            className="font-body text-bakery-accent hover:text-bakery-accent/80 text-sm underline transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </main>
  )
}
