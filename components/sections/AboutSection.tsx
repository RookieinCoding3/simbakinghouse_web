export default function AboutSection() {
  return (
    <section
      id="about"
      className="py-16 md:py-24 bg-bakery-cream"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <div>
              <p className="font-body text-bakery-accent text-sm sm:text-base tracking-widest uppercase mb-2">
                Our Story
              </p>
              <h2 className="font-heading text-bakery-brown text-4xl sm:text-5xl md:text-6xl">
                ABOUT US
              </h2>
            </div>

            <div className="space-y-4 font-body text-bakery-brown/80 text-base sm:text-lg leading-relaxed">
              <p>
                Welcome to <span className="font-bold text-bakery-brown">Sim Baking House</span>,
                where tradition meets passion in every bite. Nestled in the heart of Penang,
                we've been crafting artisanal baked goods that bring warmth and joy to our community.
              </p>
              <p>
                Our journey began with a simple belief: that baking is more than just following
                recipes—it's about pouring love, care, and dedication into every creation.
                From our signature breads to our delicate pastries, each item is handcrafted
                using time-honored techniques and the finest ingredients.
              </p>
              <p>
                At Sim Baking House, we're not just bakers; we're storytellers. Every loaf,
                every cake, every pastry tells a story of heritage, craftsmanship, and the
                warm embrace of home. We invite you to taste the difference that passion makes.
              </p>
            </div>

            <div className="pt-4">
              <div className="flex items-center space-x-4 text-bakery-brown">
                <div className="text-center">
                  <p className="font-heading text-3xl sm:text-4xl text-bakery-accent">
                    10+
                  </p>
                  <p className="font-body text-sm sm:text-base">Years of Excellence</p>
                </div>
                <div className="w-px h-12 bg-bakery-brown/20"></div>
                <div className="text-center">
                  <p className="font-heading text-3xl sm:text-4xl text-bakery-accent">
                    100%
                  </p>
                  <p className="font-body text-sm sm:text-base">Handcrafted</p>
                </div>
                <div className="w-px h-12 bg-bakery-brown/20"></div>
                <div className="text-center">
                  <p className="font-heading text-3xl sm:text-4xl text-bakery-accent">
                    ∞
                  </p>
                  <p className="font-body text-sm sm:text-base">Love & Care</p>
                </div>
              </div>
            </div>
          </div>

          {/* Image Placeholder */}
          <div className="relative h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-bakery-accent/20 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-24 h-24 mx-auto text-bakery-brown/30 mb-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="font-body text-bakery-brown/50 text-sm">
                  Your bakery image here
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
