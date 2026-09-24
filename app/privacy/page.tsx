import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import { CONTACT_EMAIL } from '@/lib/site'

// Minimal version to give the Phase 3 checkout consent checkbox a real
// page to link to. Phase 5.5 covers this properly (PDPA-specific review,
// the 12-month deletion policy/automation) — treat this as a placeholder
// until then, not a finished legal page.
export const metadata: Metadata = pageMetadata({
  path: '/privacy',
  title: 'Privacy | Sim Baking House',
  description: 'What Sim Baking House collects when you place an order, and why.',
})

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-paper px-4 py-16 md:py-24">
      <div className="max-w-xl mx-auto space-y-8">
        <h1 className="font-heading text-ink text-4xl md:text-5xl">Privacy</h1>

        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-ink/70">What we collect</h2>
          <p className="text-sm text-muted leading-relaxed">
            When you place an order, we collect your name, phone number, and the details of
            your order (items, quantities, collection or delivery preferences, and any notes
            you add).
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-ink/70">Why</h2>
          <p className="text-sm text-muted leading-relaxed">
            To prepare your order, confirm stock and pricing with you on WhatsApp, and let you
            check your order&apos;s status.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-ink/70">How long</h2>
          <p className="text-sm text-muted leading-relaxed">
            We aim to delete order records after 12 months.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-ink/70">Contact</h2>
          <p className="text-sm text-muted leading-relaxed">
            Questions about your data — email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-ink">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  )
}
