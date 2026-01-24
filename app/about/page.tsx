import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'About Us | Sim Baking House',
  description: 'From a home kitchen to helping bakers across Penang. Meet Sim and discover why every baker deserves good flour.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-16 md:pt-20 bg-white">
      {/* 1. Simple Hero */}
      <section className="py-16 md:py-20 bg-bakery-dark">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <p className="font-body text-bakery-accent text-sm uppercase mb-4">
            Meet Sim
          </p>
          <h1 className="font-heading text-bakery-cream text-4xl sm:text-5xl md:text-6xl mb-4">
            EVERY BAKER DESERVES GOOD FLOUR
          </h1>
          <p className="font-body text-bakery-cream/80 text-lg md:text-xl max-w-2xl mx-auto">
            What started in a small home kitchen became a place where bakers help bakers.
          </p>
        </div>
      </section>

      {/* 2. The Beginning - Simpler */}
      <section className="py-16 md:py-20 bg-bakery-cream">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="font-heading text-bakery-brown text-3xl md:text-4xl">
                It Started With Failure
              </h2>
              <div className="space-y-4 font-body text-bakery-brown/80 text-base md:text-lg leading-relaxed">
                <p>
                  Sim remembers watching her first loaf come out of the oven—flat, dense, nothing like the pictures. She tried again. And again. Sometimes the dough wouldn&apos;t rise. Sometimes it tasted bitter. Every baker knows this feeling.
                </p>
                <p>
                  But the real heartbreak? Penang didn&apos;t have the flour she needed. The yeast was old. She watched other home bakers give up because they couldn&apos;t find proper ingredients. It hurt to see people lose their dream of baking because of something so simple.
                </p>
                <p>
                  So she made a promise: no baker in Penang should have to give up because they can&apos;t find good flour. That&apos;s why this shop exists. For everyone who&apos;s ever pulled a sad loaf from the oven and wanted to try again.
                </p>
              </div>
            </div>
            <div className="relative h-[400px] md:h-[500px] bg-white rounded-lg overflow-hidden shadow-lg">
              <Image
                src="/images/sim-kitchen.svg"
                alt="Sim's kitchen workspace"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Sourdough - Simplified */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-12 space-y-4">
            <h2 className="font-heading text-bakery-brown text-3xl md:text-4xl">
              The Starter That Changed Everything
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 text-base md:text-lg">
            <div className="space-y-4 font-body text-bakery-brown/80 leading-relaxed">
              <p>
                When Sim first tasted real sourdough in a small bakery in Europe, she almost cried. The crust crackled. The inside was soft with those beautiful holes. It tasted alive—tangy, complex, nothing like the bread back home.
              </p>
              <p>
                She begged the baker to teach her. He gave her a jar of his starter, decades old, and showed her how to feed it. She carried it back to Penang like treasure.
              </p>
            </div>
            <div className="space-y-4 font-body text-bakery-brown/80 leading-relaxed">
              <p>
                Every morning at 6 AM, before opening the shop, Sim feeds that same starter. It bubbles and grows, alive with wild yeast. Some days it smells sweet like fruit. Some days more sour.
              </p>
              <p>
                That&apos;s the magic of sourdough—it&apos;s never exactly the same twice. It takes time and patience. But when you pull that perfect loaf from the oven, golden and singing... you understand why bakers do this.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Community - Casual */}
      <section className="py-16 md:py-20 bg-bakery-cream">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-10 space-y-3">
            <h2 className="font-heading text-bakery-brown text-3xl md:text-4xl">
              You&apos;re Not Baking Alone
            </h2>
            <p className="font-body text-bakery-brown/60 text-base md:text-lg">
              The best part of this shop? The people.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-8 space-y-4 rounded-lg">
              <h3 className="font-heading text-bakery-brown text-xl md:text-2xl">
                We&apos;ve Been There
              </h3>
              <p className="font-body text-bakery-brown/70 leading-relaxed">
                A woman came in last week almost in tears—her daughter&apos;s birthday cake collapsed. We sat down together, talked through what happened, figured out the oven was too hot. She came back three days later with photos of the most beautiful cake. That smile? That&apos;s why we&apos;re here.
              </p>
            </div>
            <div className="bg-bakery-brown p-8 space-y-4 rounded-lg text-bakery-cream">
              <h3 className="font-heading text-bakery-accent text-xl md:text-2xl">
                Start Your First Loaf
              </h3>
              <p className="font-body text-bakery-cream/80 leading-relaxed">
                Never touched dough before? Perfect. We&apos;ll help you choose the right flour, show you how to knead, tell you exactly what the dough should feel like. Your first loaf might be wonky. But it&apos;ll be yours. And trust us—nothing tastes better than bread you made with your own hands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Gallery - Your Images */}
      <section className="bg-bakery-dark">
        <div className="grid grid-cols-2 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="relative h-[200px] md:h-[280px] overflow-hidden group">
              <Image
                src={`/images/gallery/fresh-bake-${i}.svg`}
                alt={`Fresh bake ${i}`}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-bakery-dark/20 group-hover:bg-transparent transition-colors duration-500"></div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Simple CTA */}
      <section className="py-16 md:py-20 bg-white text-center">
        <div className="container mx-auto px-4 max-w-2xl space-y-8">
          <h2 className="font-heading text-bakery-brown text-3xl md:text-4xl">
            Ready to Bake Something Amazing?
          </h2>
          <p className="font-body text-bakery-brown/60 text-lg leading-relaxed">
            Come visit us. Smell the fresh sourdough. Ask Sim about that starter. Pick up some flour and start your baking journey. We open early (6:30 AM) because good bread waits for no one.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link
              href="/products"
              className="bg-bakery-accent text-bakery-dark px-8 py-4 font-heading text-lg hover:bg-bakery-brown hover:text-bakery-cream transition-all rounded-lg"
            >
              START BAKING TODAY
            </Link>
            <Link
              href="/location"
              className="border-2 border-bakery-brown text-bakery-brown px-8 py-4 font-heading text-lg hover:bg-bakery-brown hover:text-white transition-all rounded-lg"
            >
              FIND US IN PENANG
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
