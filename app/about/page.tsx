import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: '/about',
  title: 'Our Journey | Sim Baking House',
  description: "From a lover of baking to a community mentor. Discover Sim's story.",
})

const LABEL = 'text-xs uppercase tracking-[0.25em] font-semibold text-ink'
const BODY = 'text-sm text-muted leading-relaxed'
const LINK =
  'text-xs uppercase tracking-widest text-ink font-medium inline-flex items-center gap-2 hover:gap-3 transition-all'

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* 1. Hero */}
      <section className="border-b border-line">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-24 md:py-32 text-center space-y-6">
          <p className={LABEL}>Meet Sim</p>
          <h1 className="font-heading text-ink text-5xl md:text-7xl leading-[1.05] max-w-4xl mx-auto">
            Every baker deserves good flour.
          </h1>
          <p className="text-sm text-muted max-w-xl mx-auto leading-relaxed">
            What started in a small home kitchen became a place where bakers help bakers.
          </p>
        </div>
      </section>

      {/* 2. The failure */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-24 border-b border-line">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-5 space-y-6">
            <h2 className={LABEL}>It started with failure</h2>
            <p className="font-heading text-3xl sm:text-4xl leading-tight text-ink">
              Every baker knows this feeling.
            </p>
            <p className={BODY}>
              Sim remembers her first loaf coming out of the oven—flat, dense, nothing like the pictures. She tried again. And again.
            </p>
            <p className={BODY}>
              The real heartbreak? Penang didn&apos;t have the premium flour she needed. She made a promise: no baker in our community should have to give up because they can&apos;t find proper ingredients.
            </p>
          </div>
          <div className="lg:col-span-7 relative aspect-[4/3] bg-[#E3DACE] overflow-hidden">
            <Image
              src="/images/sim-kitchen.svg"
              alt="Sim's kitchen workspace"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* 3. The sourdough heart */}
      <section className="bg-sand border-b border-[#E5DDD2] py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 grid lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5 space-y-6">
            <h2 className={LABEL}>The starter that changed everything</h2>
            <p className="font-heading text-3xl sm:text-4xl leading-tight text-ink">
              A living starter, ready for your kitchen.
            </p>
          </div>
          <div className="lg:col-span-7 grid md:grid-cols-2 gap-8">
            <p className={`${BODY} border-l border-clay/40 pl-6`}>
              A trip to Europe revealed the magic of sourdough. Sim brought back more than just recipes; she brought back a passion for the &quot;living bread.&quot; She cultivated her own starter at home, and couldn&apos;t stop thinking about it.
            </p>
            <p className={`${BODY} border-l border-clay/40 pl-6`}>
              That&apos;s why we stock the same starter culture and high-protein bread flour she uses herself — so you can bring that tangy, living bread home, without the trip to Europe.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Community */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-24 border-b border-line">
        <div className="max-w-2xl mb-12 space-y-4">
          <h2 className={LABEL}>You&apos;re not baking alone</h2>
          <p className="font-heading text-3xl sm:text-4xl leading-tight text-ink">
            The best part of this shop? The people.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-px bg-line border border-line">
          <div className="bg-paper p-8 md:p-12 space-y-4">
            <h3 className="text-[11px] uppercase tracking-wider text-[#3D3A37] font-semibold">We&apos;ve been there</h3>
            <p className={BODY}>
              Our regulars don&apos;t just buy ingredients; they stay to discuss hydration levels and folding techniques. Whether your cake collapsed or your yeast didn&apos;t rise, Sim is here to troubleshoot with you.
            </p>
          </div>
          <div className="bg-paper p-8 md:p-12 space-y-4">
            <h3 className="text-[11px] uppercase tracking-wider text-[#3D3A37] font-semibold">Start your first loaf</h3>
            <p className={BODY}>
              Never touched dough before? Perfect. We&apos;ll help you choose the right flour and guide you through your &quot;baking road.&quot; You aren&apos;t alone in the kitchen anymore.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Gallery row */}
      <div className="grid grid-cols-2 md:grid-cols-5 border-b border-line">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="relative aspect-square overflow-hidden group">
            <Image
              src={`/images/gallery/fresh-bake-${i}.jpg`}
              alt={`Fresh bake ${i}`}
              fill
              sizes="(max-width: 768px) 50vw, 20vw"
              className="object-cover grayscale group-hover:grayscale-0 transition duration-500"
            />
          </div>
        ))}
      </div>

      {/* 6. CTA */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-24 text-center space-y-8">
        <h2 className="font-heading text-ink text-4xl md:text-6xl leading-tight max-w-3xl mx-auto">
          Ready to bake something amazing?
        </h2>
        <div className="flex flex-col sm:flex-row gap-8 justify-center">
          <Link href="/products" className={LINK}>
            Start baking today &rarr;
          </Link>
          <Link href="/location" className={LINK}>
            Find us in Penang &rarr;
          </Link>
        </div>
      </section>
    </main>
  )
}
