import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'About Us | Sim Baking House',
  description: 'Meet Sim and learn how we help the Penang baking community find quality ingredients.',
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
            BAKING IN PENANG SINCE 2017
          </h1>
          <p className="font-body text-bakery-cream/80 text-lg md:text-xl max-w-2xl mx-auto">
            Started at home. Now helping other bakers find what they need.
          </p>
        </div>
      </section>

      {/* 2. The Beginning - Simpler */}
      <section className="py-16 md:py-20 bg-bakery-cream">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="font-heading text-bakery-brown text-3xl md:text-4xl">
                How It Started
              </h2>
              <div className="space-y-4 font-body text-bakery-brown/80 text-base md:text-lg leading-relaxed">
                <p>
                  Sim started baking at home. Like most home bakers, she tested recipes, adjusted things, and had plenty of failed batches.
                </p>
                <p>
                  The hardest part? Finding good flour and yeast in Penang. She had to order from overseas or make do with what was available.
                </p>
                <p>
                  If she was struggling, other bakers probably were too. So she opened a small shop to make quality ingredients easier to find.
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
              About That Sourdough Starter
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 text-base md:text-lg">
            <div className="space-y-4 font-body text-bakery-brown/80 leading-relaxed">
              <p>
                On a trip to Europe, Sim learned about real sourdough—made with wild yeast instead of commercial yeast.
                She brought a starter back to Penang and started feeding it daily.
              </p>
            </div>
            <div className="space-y-4 font-body text-bakery-brown/80 leading-relaxed">
              <p>
                That same starter is still alive today. It needs regular feeding, kind of like a pet.
                The long fermentation makes bread easier to digest and gives it more flavor.
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
              Come Talk Baking
            </h2>
            <p className="font-body text-bakery-brown/60 text-base md:text-lg">
              It&apos;s not just about selling ingredients.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-8 space-y-4 rounded-lg">
              <h3 className="font-heading text-bakery-brown text-xl md:text-2xl">
                Ask Questions
              </h3>
              <p className="font-body text-bakery-brown/70 leading-relaxed">
                People drop by to ask about proofing times, oven temps, or why their dough didn&apos;t rise.
                We talk about what worked and what didn&apos;t.
              </p>
            </div>
            <div className="bg-bakery-brown p-8 space-y-4 rounded-lg text-bakery-cream">
              <h3 className="font-heading text-bakery-accent text-xl md:text-2xl">
                New to Baking?
              </h3>
              <p className="font-body text-bakery-cream/80 leading-relaxed">
                Never made bread before? No problem. We&apos;ll help you pick flour, explain measurements,
                and walk you through it. Your first loaf probably won&apos;t be perfect. That&apos;s normal.
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
            Need Baking Supplies?
          </h2>
          <p className="font-body text-bakery-brown/60 text-lg">
            Stop by the shop. We&apos;re open daily 6:30 AM to 1:00 PM.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link
              href="/products"
              className="bg-bakery-accent text-bakery-dark px-8 py-4 font-heading text-lg hover:bg-bakery-brown hover:text-bakery-cream transition-all rounded-lg"
            >
              SEE WHAT WE HAVE
            </Link>
            <Link
              href="/location"
              className="border-2 border-bakery-brown text-bakery-brown px-8 py-4 font-heading text-lg hover:bg-bakery-brown hover:text-white transition-all rounded-lg"
            >
              GET DIRECTIONS
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
