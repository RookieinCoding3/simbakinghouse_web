import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Our Journey | Sim Baking House',
  description: "From a lover of baking to a community mentor. Discover Sim's story.",
}

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-20 bg-bakery-dark">
      {/* 1. The Hook - Minimalist Hero */}
      <section className="relative h-[60vh] flex items-center justify-center paper-texture border-b border-bakery-cream/10">
        <div className="text-center px-4 animate-fade-in-up">
          <p className="font-body text-bakery-accent text-sm tracking-[0.4em] uppercase mb-4">Meet Sim</p>
          <h1 className="font-heading text-bakery-cream text-6xl md:text-9xl tracking-tighter leading-none">
            EVERY BAKER <br/> DESERVES GOOD FLOUR
          </h1>
          <p className="font-body text-bakery-cream/60 text-lg mt-6 max-w-xl mx-auto italic">
            What started in a small home kitchen became a place where bakers help bakers.
          </p>
        </div>
      </section>

      {/* 2. Act I: The Failure (Relatability) */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="font-heading text-bakery-brown text-5xl tracking-tight">IT STARTED WITH FAILURE</h2>
              <p className="font-body text-bakery-brown/70 text-lg leading-relaxed">
                Sim remembers her first loaf coming out of the oven—flat, dense, nothing like the pictures. She tried again. And again.
                <span className="block mt-4 text-bakery-brown font-semibold italic">Every baker knows this feeling.</span>
              </p>
              <p className="font-body text-bakery-brown/70 text-lg">
                The real heartbreak? Penang didn&apos;t have the premium flour she needed. She made a promise: no baker in our community should have to give up because they can&apos;t find proper ingredients.
              </p>
            </div>
            <div className="relative h-[450px] bg-bakery-cream rounded-lg overflow-hidden shadow-2xl">
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

      {/* 3. Act II: The Sourdough Heart (The "Why") */}
      <section className="py-32 bg-bakery-dark paper-texture text-center overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          <h2 className="font-heading text-bakery-accent text-5xl md:text-7xl">THE STARTER THAT CHANGED EVERYTHING</h2>
          <div className="grid md:grid-cols-2 gap-12 text-left">
            <p className="font-body text-bakery-cream/80 text-lg leading-relaxed border-l border-bakery-accent/30 pl-8">
              A trip to Europe revealed the magic of Sourdough. Sim brought back more than just recipes; she brought back a passion for the &quot;living bread.&quot;
              She cultivated her own bacteria, filling her home with an aroma that makes waking up a joy.
            </p>
            <p className="font-body text-bakery-cream/80 text-lg leading-relaxed border-l border-bakery-accent/30 pl-8">
              Every morning at 6:30 AM, we feed that same starter. It&apos;s tangy, complex, and healthy.
              We brought this premium grade to Penang so your home can smell like ours.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Act III: The Community (The Beginner Reassurance) */}
      <section className="py-24 bg-bakery-cream">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-heading text-bakery-brown text-5xl">YOU&apos;RE NOT BAKING ALONE</h2>
            <p className="font-body text-bakery-brown/60 text-lg uppercase tracking-widest">The best part of this shop? The people.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-12 border border-bakery-brown/5 shadow-sm">
              <h3 className="font-heading text-bakery-brown text-3xl mb-4 italic uppercase">We&apos;ve Been There</h3>
              <p className="font-body text-bakery-brown/70 leading-relaxed text-lg">
                Our regulars don&apos;t just buy ingredients; they stay to discuss hydration levels and folding techniques.
                Whether your cake collapsed or your yeast didn&apos;t rise, Sim is here to troubleshoot with you.
              </p>
            </div>
            <div className="bg-bakery-brown p-12 text-bakery-cream shadow-2xl">
              <h3 className="font-heading text-bakery-accent text-3xl mb-4 italic uppercase">Start Your First Loaf</h3>
              <p className="font-body text-bakery-cream/80 leading-relaxed text-lg">
                Never touched dough before? Perfect. We&apos;ll help you choose the right flour and guide you through your &quot;baking road.&quot;
                <span className="text-bakery-accent font-bold block mt-4">You aren&apos;t alone in the kitchen anymore.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Sensory Visual Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-1 bg-bakery-dark">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="relative aspect-square overflow-hidden group">
            <Image
              src={`/images/gallery/fresh-bake-${i}.svg`}
              alt={`Fresh bake ${i}`}
              fill
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
            />
          </div>
        ))}
      </div>

      {/* 6. The Action - Stronger CTA */}
      <section className="py-32 bg-white text-center">
        <div className="container mx-auto px-6 max-w-3xl space-y-12">
          <h2 className="font-heading text-bakery-brown text-5xl md:text-8xl tracking-tighter">READY TO BAKE SOMETHING AMAZING?</h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/products" className="bg-bakery-accent text-bakery-dark px-12 py-5 font-heading text-2xl tracking-widest hover:scale-105 transition-all shadow-xl">
              START BAKING TODAY
            </Link>
            <Link href="/location" className="border-2 border-bakery-brown text-bakery-brown px-12 py-5 font-heading text-2xl tracking-widest hover:bg-bakery-brown hover:text-white transition-all">
              FIND US IN PENANG
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
