import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Our Story | Sim Baking House',
  description: 'The journey of Sim, from a home baker to helping the Penang baking community find quality ingredients.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-16 md:pt-20 bg-bakery-dark">
      {/* 1. Personal Hero */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden paper-texture">
        <div className="absolute inset-0 bg-bakery-brown/20 z-0"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl animate-fade-in">
          <p className="font-body text-bakery-accent text-sm tracking-[0.4em] uppercase mb-4">
            From Home Baker to Your Baking Partner
          </p>
          <h1 className="font-heading text-bakery-cream text-5xl sm:text-6xl md:text-8xl mb-6 tracking-tighter leading-tight">
            A BAKER&apos;S STORY <br /> IN PENANG
          </h1>
          <p className="font-body text-bakery-cream/80 text-lg md:text-xl italic max-w-2xl mx-auto">
            &quot;I started baking at home for my family. Now I help other bakers find the ingredients they need.&quot; — Sim
          </p>
        </div>
      </section>

      {/* 2. The Beginning */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="space-y-6 md:space-y-8">
              <div className="inline-block px-3 py-1 border border-bakery-accent/30 text-bakery-accent text-xs tracking-widest uppercase">
                How It Started
              </div>
              <h2 className="font-heading text-bakery-brown text-4xl md:text-5xl">
                TRIAL, ERROR, AND LOTS OF FLOUR
              </h2>
              <div className="space-y-4 md:space-y-6 font-body text-bakery-brown/80 text-base md:text-lg leading-relaxed">
                <p>
                  Like many home bakers, Sim started in her kitchen—testing recipes, adjusting hydration levels, and trying to get that perfect crumb.
                  Some batches worked. Many didn&apos;t. But every failed loaf taught her something new.
                </p>
                <p>
                  The biggest problem? Finding good flour and yeast in Penang. She had to order ingredients from overseas or settle for what was available locally.
                  If she was struggling to find quality supplies, other bakers must be too. That&apos;s when the idea started: make good baking ingredients easy to find.
                </p>
              </div>
            </div>
            <div className="relative h-[400px] md:h-[500px] bg-bakery-cream flex items-center justify-center p-8 group">
              <div className="absolute inset-0 border-2 border-bakery-accent/10 m-4 group-hover:m-2 transition-all duration-500"></div>
              <p className="font-body text-bakery-brown/20 italic text-center text-sm md:text-base">
                [Photo of Sim&apos;s home kitchen or early baking experiments]
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Sourdough Story */}
      <section className="py-16 md:py-24 bg-bakery-dark paper-texture text-bakery-cream overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center space-y-8 md:space-y-12">
          <h2 className="font-heading text-bakery-accent text-4xl md:text-5xl lg:text-7xl tracking-tighter">
            WHY SOURDOUGH CHANGED EVERYTHING
          </h2>
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start text-left">
            <div className="space-y-4 md:space-y-6">
              <p className="font-body text-base md:text-lg leading-relaxed text-bakery-cream/80">
                During a trip to Europe, Sim learned about real sourdough bread—made with wild yeast and natural fermentation.
                The taste was completely different from anything she&apos;d made before. She brought a starter back to Penang and began feeding it daily.
              </p>
            </div>
            <div className="space-y-4 md:space-y-6 border-l border-bakery-accent/20 pl-6 md:pl-8">
              <p className="font-body text-base md:text-lg leading-relaxed text-bakery-cream/80">
                That starter is still alive today. Every loaf baked in our house comes from the same culture she brought home years ago.
                It&apos;s a living ingredient that needs care—just like baking itself. The longer fermentation makes bread that&apos;s easier to digest and full of flavor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The Community */}
      <section className="py-16 md:py-24 bg-bakery-cream">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-12 md:mb-16 space-y-4">
            <h2 className="font-heading text-bakery-brown text-4xl md:text-5xl">
              MORE THAN JUST INGREDIENTS
            </h2>
            <p className="font-body text-bakery-brown/60 text-base md:text-lg">
              A place where bakers help each other learn.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white p-8 md:p-10 space-y-4 md:space-y-6 shadow-sm border border-bakery-brown/5">
              <h3 className="font-heading text-bakery-brown text-2xl md:text-3xl">
                Talk About Baking
              </h3>
              <p className="font-body text-bakery-brown/70 leading-relaxed text-base md:text-lg">
                Regulars stop by to ask about proofing times, oven temperatures, or why their dough didn&apos;t rise.
                We share what works and what doesn&apos;t. It&apos;s how we all get better at baking.
              </p>
            </div>
            <div className="bg-bakery-brown p-8 md:p-10 space-y-4 md:space-y-6 text-bakery-cream shadow-xl">
              <h3 className="font-heading text-bakery-accent text-2xl md:text-3xl uppercase">
                New to Baking? Start Here
              </h3>
              <p className="font-body text-bakery-cream/80 leading-relaxed text-base md:text-lg">
                Never baked bread before? That&apos;s fine. We can help you pick the right flour, explain baker&apos;s percentages,
                and walk you through your first loaf. Everyone starts somewhere, and most first loaves don&apos;t turn out perfect. That&apos;s normal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Gallery */}
      <section className="bg-bakery-dark border-y border-bakery-cream/10">
        <div className="grid grid-cols-2 md:grid-cols-5 h-[250px] md:h-[300px]">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="relative overflow-hidden group border-x border-bakery-cream/5">
              <div className="absolute inset-0 bg-bakery-brown/20 group-hover:bg-transparent transition-colors duration-500"></div>
              <div className="h-full flex items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity">
                <p className="font-heading text-xs text-bakery-accent tracking-tighter uppercase text-center px-2">
                  Fresh Bake {i}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CTA */}
      <section className="py-16 md:py-24 bg-white text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl space-y-8 md:space-y-10">
          <h2 className="font-heading text-bakery-brown text-3xl sm:text-4xl md:text-6xl tracking-tighter">
            READY TO BAKE?
          </h2>
          <p className="font-body text-bakery-brown/60 text-lg md:text-xl max-w-xl mx-auto">
            Whether you need bread flour, a pizza stone, or advice on your starter, we&apos;re here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center pt-4">
            <Link
              href="/products"
              className="bg-bakery-accent text-bakery-dark px-8 md:px-10 py-4 md:py-5 font-heading text-lg md:text-xl tracking-widest hover:bg-bakery-brown hover:text-bakery-cream transition-all shadow-lg uppercase"
            >
              Shop Ingredients
            </Link>
            <Link
              href="/location"
              className="border-2 border-bakery-brown text-bakery-brown px-8 md:px-10 py-4 md:py-5 font-heading text-lg md:text-xl tracking-widest hover:bg-bakery-brown hover:text-white transition-all uppercase"
            >
              Visit Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
