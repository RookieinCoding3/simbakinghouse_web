import Link from 'next/link'
import Image from 'next/image'
import { fetchShopSettings } from '@/lib/firebase/settings'

export default async function HeroSection() {
  const { shopOpensAt } = await fetchShopSettings()
  return (
    <section id="hero" className="w-full border-b border-line">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2">
        {/* Left panel: video with overlay text */}
        <div className="relative h-[480px] lg:h-[620px] overflow-hidden bg-line border-b lg:border-b-0 lg:border-r border-line">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/landing_page.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute bottom-10 left-6 right-6 sm:left-10 sm:right-10 text-white space-y-3">
            <h1 className="font-heading text-4xl lg:text-5xl font-normal leading-tight">
              Baking supplies in Bayan Lepas. Open {shopOpensAt} daily.
            </h1>
            <Link
              href="/about"
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
