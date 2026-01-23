import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Our Story | Sim Baking House',
  description: 'The journey of Sim, from a baking lover to the founder of a community-focused bakery in Penang.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-16 md:pt-20 bg-bakery-dark">
      {/* 1. Personal Hero - The "Heart" of the House */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden paper-texture">
        <div className="absolute inset-0 bg-bakery-brown/20 z-0"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl animate-fade-in">
          <p className="font-body text-bakery-accent text-sm tracking-[0.4em] uppercase mb-4">
            Born from a Passion for Perfection
          </p>
          <h1 className="font-heading text-bakery-cream text-5xl sm:text-6xl md:text-8xl mb-6 tracking-tighter leading-tight">
            A BAKER&apos;S HEART <br /> IN PENANG
          </h1>
          <p className="font-body text-bakery-cream/80 text-lg md:text-xl italic max-w-2xl mx-auto">
            &quot;I wanted to bring the best to my family, and then I realized I wanted to bring the best to yours, too.&quot; — Sim
          </p>
        </div>
      </section>

      {/* 2. The Struggle & The Spark (First Scroll) */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="space-y-6 md:space-y-8">
              <div className="inline-block px-3 py-1 border border-bakery-accent/30 text-bakery-accent text-xs tracking-widest uppercase">
                The Beginning
              </div>
              <h2 className="font-heading text-bakery-brown text-4xl md:text-5xl">
                THE SCIENTIST IN THE KITCHEN
              </h2>
              <div className="space-y-4 md:space-y-6 font-body text-bakery-brown/80 text-base md:text-lg leading-relaxed">
                <p>
                  Before Sim Baking House was a store, it was a home filled with the sound of flipping recipe pages and the dust of trial and error.
                  For years, Sim was a baking lover who never settled. She spent countless nights researching, failing, and trying again—searching for that one perfect crumb.
                </p>
                <p>
                  The biggest obstacle? Penang lacked the premium-grade ingredients she needed. She knew if she was struggling, other local baking lovers were too.
                  That frustration sparked a vision: a space where the finest ingredients weren&apos;t a luxury, but a standard for everyone.
                </p>
              </div>
            </div>
            <div className="relative h-[400px] md:h-[500px] bg-bakery-cream flex items-center justify-center p-8 group">
              <div className="absolute inset-0 border-2 border-bakery-accent/10 m-4 group-hover:m-2 transition-all duration-500"></div>
              <p className="font-body text-bakery-brown/20 italic text-center text-sm md:text-base">
                [A warm photo of Sim researching recipes or surrounded by premium flour sacks]
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The European Awakening (The Sourdough Story) */}
      <section className="py-16 md:py-24 bg-bakery-dark paper-texture text-bakery-cream overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center space-y-8 md:space-y-12">
          <h2 className="font-heading text-bakery-accent text-4xl md:text-5xl lg:text-7xl tracking-tighter">
            THE SOUL OF THE HOUSE: SOURDOUGH
          </h2>
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start text-left">
            <div className="space-y-4 md:space-y-6">
              <p className="font-body text-base md:text-lg leading-relaxed text-bakery-cream/80">
                A trip to Europe changed everything. It was there that Sim fell in love with the primal, honest nature of Sourdough.
                Returning to Penang, she began cultivating her own bacteria—a living heart that fills our house with that unmistakable aroma every single morning.
              </p>
            </div>
            <div className="space-y-4 md:space-y-6 border-l border-bakery-accent/20 pl-6 md:pl-8">
              <p className="font-body text-base md:text-lg leading-relaxed text-bakery-cream/80">
                To Sim, baking is about the legacy of health and flavor. Every loaf is a piece of that original bacteria cultivated years ago,
                ensuring that when you wake up, your home smells of the same artisanal care she gives to her own family.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The Community (Replaces 'Why Choose Us' with 'Your Baking Road') */}
      <section className="py-16 md:py-24 bg-bakery-cream">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-12 md:mb-16 space-y-4">
            <h2 className="font-heading text-bakery-brown text-4xl md:text-5xl">
              BEYOND THE INGREDIENTS
            </h2>
            <p className="font-body text-bakery-brown/60 text-base md:text-lg">
              A place to grow, discuss, and perfect your craft.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white p-8 md:p-10 space-y-4 md:space-y-6 shadow-sm border border-bakery-brown/5">
              <h3 className="font-heading text-bakery-brown text-2xl md:text-3xl italic">
                A Shared Skill
              </h3>
              <p className="font-body text-bakery-brown/70 leading-relaxed text-base md:text-lg">
                Our house is a hub for regulars who drop by just to discuss a new technique or a challenging recipe.
                Whether it&apos;s a specific hydration level or a new folding method, we learn together.
              </p>
            </div>
            <div className="bg-bakery-brown p-8 md:p-10 space-y-4 md:space-y-6 text-bakery-cream shadow-xl">
              <h3 className="font-heading text-bakery-accent text-2xl md:text-3xl italic tracking-wide md:tracking-widest uppercase">
                You Don&apos;t Bake Alone
              </h3>
              <p className="font-body text-bakery-cream/80 leading-relaxed text-base md:text-lg">
                Are you a complete beginner? Don&apos;t be intimidated. Sim&apos;s greatest joy is guiding new bakers through their &quot;baking road.&quot;
                We are here to help you navigate every failure until you reach your first success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Sensory Gallery (Visual proof of the smell) */}
      <section className="bg-bakery-dark border-y border-bakery-cream/10">
        <div className="grid grid-cols-2 md:grid-cols-5 h-[250px] md:h-[300px]">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="relative overflow-hidden group border-x border-bakery-cream/5">
              <div className="absolute inset-0 bg-bakery-brown/20 group-hover:bg-transparent transition-colors duration-500"></div>
              <div className="h-full flex items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity">
                <p className="font-heading text-xs text-bakery-accent tracking-tighter uppercase text-center px-2">
                  Fresh Morning Bake {i}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Personalized CTA */}
      <section className="py-16 md:py-24 bg-white text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl space-y-8 md:space-y-10">
          <h2 className="font-heading text-bakery-brown text-3xl sm:text-4xl md:text-6xl tracking-tighter">
            READY TO START YOUR ROAD?
          </h2>
          <p className="font-body text-bakery-brown/60 text-lg md:text-xl max-w-xl mx-auto">
            From your first bag of premium flour to your most complex sourdough, let Sim be your guide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center pt-4">
            <Link
              href="/products"
              className="bg-bakery-accent text-bakery-dark px-8 md:px-10 py-4 md:py-5 font-heading text-lg md:text-xl tracking-widest hover:bg-bakery-brown hover:text-bakery-cream transition-all shadow-lg"
            >
              GET YOUR INGREDIENTS
            </Link>
            <Link
              href="/location"
              className="border-2 border-bakery-brown text-bakery-brown px-8 md:px-10 py-4 md:py-5 font-heading text-lg md:text-xl tracking-widest hover:bg-bakery-brown hover:text-white transition-all"
            >
              COME CHAT WITH SIM
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
