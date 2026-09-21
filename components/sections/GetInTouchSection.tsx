import Link from 'next/link'
import { CONTACT_WHATSAPP_URL, OPENING_HOURS } from '@/lib/site'

const CELL = 'group bg-paper p-8 md:p-10 space-y-3 hover:bg-sand transition-colors'
const CELL_LABEL = 'text-[11px] uppercase tracking-wider text-[#3D3A37] font-semibold'
const CELL_LINK =
  'text-xs uppercase tracking-widest text-ink font-medium inline-flex items-center gap-2 group-hover:gap-3 transition-all'

export default function GetInTouchSection() {
  return (
    <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-24">
      <div className="max-w-2xl mb-12 space-y-4">
        <h2 className="text-xs uppercase tracking-[0.25em] font-semibold text-ink">We&apos;re here to help</h2>
        <p className="font-heading text-3xl sm:text-4xl leading-tight text-ink">
          Need baking advice? Can&apos;t find the right ingredient? Sim is always happy to help.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-px bg-line border border-line">
        <Link href="/location" className={CELL}>
          <p className={CELL_LABEL}>Visit our store</p>
          <p className="text-xs text-muted leading-relaxed">Bayan Lepas, Penang</p>
          <p className="text-xs text-muted leading-relaxed">{OPENING_HOURS}</p>
          <p className={CELL_LINK}>Get directions &rarr;</p>
        </Link>

        <a href={CONTACT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={CELL}>
          <p className={CELL_LABEL}>WhatsApp us</p>
          <p className="text-xs text-muted leading-relaxed">Quick questions &amp; orders</p>
          <p className="text-xs text-muted leading-relaxed">Chat with Sim directly</p>
          <p className={CELL_LINK}>Start a chat &rarr;</p>
        </a>

        <a
          href={process.env.NEXT_PUBLIC_GOOGLE_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={CELL}
        >
          <p className={CELL_LABEL}>Place an order</p>
          <p className="text-xs text-muted leading-relaxed">Fill out our order form</p>
          <p className="text-xs text-muted leading-relaxed">We&apos;ll prepare your items</p>
          <p className={CELL_LINK}>Order online &rarr;</p>
        </a>
      </div>
    </section>
  )
}
