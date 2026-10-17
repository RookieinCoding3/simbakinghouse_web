import { fetchShopSettings } from '@/lib/firebase/settings'
import T from '@/components/storefront/T'

// The whole flow, before anyone adds to cart: order online, pay on WhatsApp,
// collect (the shop does not deliver).
export default async function HowToOrderSection() {
  const { openingHours } = await fetchShopSettings()
  const steps = [
    { n: 1, title: 'howto.1.title', body: 'howto.1.body' },
    { n: 2, title: 'howto.2.title', body: 'howto.2.body' },
    { n: 3, title: 'howto.3.title', body: 'howto.3.body' },
  ] as const
  return (
    <section className="border-b border-line bg-paper" aria-labelledby="howto-title" data-testid="how-to-order">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-10 md:py-14">
        <h2 id="howto-title" className="text-xs uppercase tracking-[0.25em] font-semibold text-ink mb-6">
          <T k="howto.title" />
        </h2>
        <ol className="grid md:grid-cols-3 gap-px bg-line border border-line">
          {steps.map((s) => (
            <li key={s.n} className="bg-paper p-6 flex gap-4">
              <span className="flex-shrink-0 w-9 h-9 rounded-full bg-ink text-paper flex items-center justify-center font-heading text-lg" aria-hidden="true">
                {s.n}
              </span>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-ink">
                  <T k={s.title} />
                </h3>
                <p className="text-sm text-ink/75 leading-relaxed">
                  <T k={s.body} vars={{ hours: openingHours }} />
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
