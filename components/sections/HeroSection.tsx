import Link from 'next/link'
import { fetchShopSettings } from '@/lib/firebase/settings'
import T from '@/components/storefront/T'

// Says "baking SUPPLY shop" in the first five seconds: what it is, where,
// and the two ways in. The right side is a placeholder until real shelf
// photos exist (docs/PHOTOS-NEEDED.md): no stock photos.
export default async function HeroSection({ startHref }: { startHref: string }) {
  const { openingHours } = await fetchShopSettings()
  return (
    <section id="hero" className="w-full border-b border-line bg-paper" data-testid="hero">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2">
        <div className="px-6 sm:px-10 lg:px-12 py-10 sm:py-14 lg:py-20 space-y-5 flex flex-col justify-center">
          <p className="text-[11px] uppercase tracking-[0.25em] font-semibold text-clay">
            <T k="hero.eyebrow" />
          </p>
          <h1 className="font-heading text-[2.6rem] leading-[1.05] sm:text-5xl lg:text-6xl text-ink">
            <T k="hero.title" />
          </h1>
          <p className="text-base sm:text-lg text-ink/80 leading-relaxed max-w-xl">
            <T k="hero.sub" />
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/products"
              className="inline-flex items-center justify-center bg-ink hover:bg-clay text-paper px-7 py-4 text-xs font-semibold uppercase tracking-[0.18em] min-h-[52px]"
              data-testid="hero-browse"
            >
              <T k="hero.browse" />
            </Link>
            <Link
              href={startHref}
              className="inline-flex items-center justify-center border border-ink text-ink hover:bg-sand px-7 py-4 text-xs font-semibold uppercase tracking-[0.18em] min-h-[52px]"
              data-testid="hero-start"
            >
              <T k="hero.start" />
            </Link>
          </div>
          <p className="text-xs text-muted">
            <T k="hero.hours" vars={{ hours: openingHours }} />
          </p>
        </div>

        <IngredientsPlaceholder />
      </div>
    </section>
  )
}

/** Drawn shelf of flours / premix / tools: a stand-in for a real photo. */
function IngredientsPlaceholder() {
  const items = [
    { label: 'Flour', zh: '面粉', h: 'h-28', color: 'bg-[#F1E9DC]' },
    { label: 'Premix', zh: '预拌粉', h: 'h-24', color: 'bg-[#E9D6C3]' },
    { label: 'Butter', zh: '牛油', h: 'h-16', color: 'bg-[#F4E3A8]' },
    { label: 'Sugar', zh: '糖', h: 'h-20', color: 'bg-[#FBF8F3]' },
    { label: 'Tools', zh: '工具', h: 'h-14', color: 'bg-[#D9D2C7]' },
  ]
  return (
    <div className="relative bg-[#E8DFD3] border-t lg:border-t-0 lg:border-l border-line min-h-[220px] sm:min-h-[300px] lg:min-h-[520px] flex flex-col justify-end" data-testid="hero-placeholder">
      <div aria-hidden="true" className="flex items-end justify-center gap-3 sm:gap-4 px-6 pb-0">
        {items.map((i) => (
          <div key={i.label} className={`${i.h} ${i.color} w-14 sm:w-20 border border-ink/15 shadow-sm flex items-center justify-center`}>
            <span className="text-[10px] sm:text-xs text-ink/70 text-center leading-tight">
              {i.label}
              <br />
              {i.zh}
            </span>
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="h-3 bg-[#B79F86] mx-4" />
      <p className="text-[11px] text-ink/60 text-center px-4 py-3">
        <T k="hero.photo" />
      </p>
    </div>
  )
}
