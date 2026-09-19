import Link from 'next/link'
import Image from 'next/image'

export default function BakersJourneySection() {
  return (
    <section id="story" className="bg-sand border-b border-[#E5DDD2] py-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left: story text */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-xs uppercase tracking-[0.25em] font-semibold text-ink">
              Family founded, Penang rooted
            </h2>
            <p className="font-heading text-3xl sm:text-4xl leading-tight text-ink">
              Baking is more than following recipes.
            </p>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Crafting joy since 2017 in the heart of Penang. We open our doors at 6:30 AM, personally guiding
              home bakers, small bakeries and weekend enthusiasts with tested recipes and honest advice. From
              sunrise dough to golden-brown perfection, we honour tradition while creating memories one bite at a time.
            </p>
            <div className="pt-2">
              <Link
                href="/about"
                className="text-xs uppercase tracking-widest text-ink font-medium inline-flex items-center gap-2 hover:gap-3 transition-all"
              >
                Our story &rarr;
              </Link>
            </div>
          </div>

          {/* Right: two photos */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-4 sm:gap-6">
            {[2, 3].map((n) => (
              <div key={n} className="relative aspect-[4/3] bg-[#E3DACE] overflow-hidden">
                <Image
                  src={`/images/gallery/fresh-bake-${n}.jpg`}
                  alt="Fresh bakes from Sim Baking House"
                  fill
                  sizes="(max-width: 1024px) 50vw, 400px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
