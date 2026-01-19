import Image from 'next/image'

export default function AboutSection() {
  return (
    <section
      id="about"
      className="py-24 md:py-32 bg-bakery-cream paper-texture relative"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div>
              <p className="font-body text-bakery-accent text-sm sm:text-base tracking-widest uppercase mb-3">
                Our Story
              </p>
              <h2 className="font-heading text-bakery-brown text-4xl sm:text-5xl md:text-6xl">
                ABOUT US
              </h2>
            </div>

            <div className="space-y-6 font-body text-bakery-brown/80 text-base sm:text-lg leading-relaxed">
              <p>
                Welcome to <span className="font-bold text-bakery-brown">Sim Baking House</span>,
                where tradition meets passion in every bite. Nestled in the heart of Penang,
                we&apos;ve been crafting artisanal baked goods that bring warmth and joy to our community.
              </p>
              <p>
                Our journey began with a simple belief: that baking is more than just following
                recipes—it&apos;s about pouring love, care, and dedication into every creation.
                From our signature breads to our delicate pastries, each item is handcrafted
                using time-honored techniques and the finest ingredients.
              </p>
              <p>
                At Sim Baking House, we&apos;re not just bakers; we&apos;re storytellers. Every loaf,
                every cake, every pastry tells a story of heritage, craftsmanship, and the
                warm embrace of home. We invite you to taste the difference that passion makes.
              </p>
            </div>

            <div className="pt-6">
              <div className="flex items-center justify-center md:justify-start space-x-8 text-bakery-brown">
                <div className="text-center">
                  <p className="font-heading text-4xl sm:text-5xl text-bakery-accent mb-2">
                    10+
                  </p>
                  <p className="font-body text-sm sm:text-base text-bakery-brown/70">Years of Excellence</p>
                </div>
                <div className="w-px h-16 bg-bakery-brown/20"></div>
                <div className="text-center">
                  <p className="font-heading text-4xl sm:text-5xl text-bakery-accent mb-2">
                    100%
                  </p>
                  <p className="font-body text-sm sm:text-base text-bakery-brown/70">Handcrafted</p>
                </div>
                <div className="w-px h-16 bg-bakery-brown/20"></div>
                <div className="text-center">
                  <p className="font-heading text-4xl sm:text-5xl text-bakery-accent mb-2">
                    ∞
                  </p>
                  <p className="font-body text-sm sm:text-base text-bakery-brown/70">Love & Care</p>
                </div>
              </div>
            </div>
          </div>

          {/* Logo Display */}
          <div className="relative h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-2xl bg-white/50 backdrop-blur-sm border-2 border-bakery-accent/20">
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="relative w-full h-full">
                <Image
                  src="/images/SBH_logo.svg"
                  alt="Sim Baking House Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            {/* Decorative corner elements */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-bakery-accent/30"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-bakery-accent/30"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-bakery-accent/30"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-bakery-accent/30"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
