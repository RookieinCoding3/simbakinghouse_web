import Link from 'next/link'
import Image from 'next/image'
import { fetchShopSettings } from '@/lib/firebase/settings'
import HeroVideo from './HeroVideo'

export default async function HeroSection() {
  const { shopOpensAt } = await fetchShopSettings()
  return (
    <section id="hero" className="w-full border-b border-line">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2">
        {/* Left panel: video with overlay text. The poster is what every
            visitor's server-rendered HTML actually shows — HeroVideo only
            ever adds the <video> on top of it, client-side, and only for a
            visitor who isn't on a small screen or a connection that says
            it's slow (see that component). */}
        <div className="relative h-[480px] lg:h-[620px] overflow-hidden bg-line border-b lg:border-b-0 lg:border-r border-line">
          <Image
            src="/images/hero-poster.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 700px"
            className="object-cover"
          />
          <HeroVideo />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute bottom-10 left-6 right-6 sm:left-10 sm:right-10 text-white space-y-3">
            <h1 className="font-heading text-4xl lg:text-5xl font-normal leading-tight">
              Baking supplies in Bayan Lepas. Open {shopOpensAt} daily.
            </h1>
            <Link
              href="/about"
              prefetch={false}
              className="text-xs uppercase tracking-widest text-white/90 hover:text-white underline underline-offset-4 inline-flex items-center gap-1"
            >
              Our story &rarr;
            </Link>
          </div>
        </div>

        {/* Right panel: still */}
        <div className="relative h-[360px] lg:h-[620px] overflow-hidden bg-[#E0D7CB]">
          <Image
            src="/images/gallery/fresh-bake-1.jpg"
            alt="A freshly baked sourdough loaf"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 700px"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}
