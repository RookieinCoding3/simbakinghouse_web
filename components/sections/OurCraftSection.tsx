export default function OurCraftSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="font-heading text-bakery-brown text-4xl md:text-5xl mb-4 tracking-wide">
            THE ART OF THE SLOW BAKE
          </h2>
          <p className="font-body text-bakery-brown/60 text-lg italic">
            True flavor takes time and patience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 text-center">
          {/* Step 1 */}
          <div className="space-y-4">
            <span className="font-heading text-bakery-accent text-6xl opacity-20">
              01
            </span>
            <h3 className="font-heading text-bakery-brown text-2xl tracking-wide uppercase">
              Sourcing
            </h3>
            <p className="font-body text-bakery-brown/70 leading-relaxed">
              We hand-select premium flours and seasonal local ingredients, ensuring every base
              component meets our high artisan standards.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-4">
            <span className="font-heading text-bakery-accent text-6xl opacity-20">
              02
            </span>
            <h3 className="font-heading text-bakery-brown text-2xl tracking-wide uppercase">
              Fermentation
            </h3>
            <p className="font-body text-bakery-brown/70 leading-relaxed">
              Our breads undergo long, natural cold fermentation processes to develop complex
              flavors and a gut-friendly structure.
            </p>
          </div>

          {/* Step 3 */}
          <div className="space-y-4">
            <span className="font-heading text-bakery-accent text-6xl opacity-20">
              03
            </span>
            <h3 className="font-heading text-bakery-brown text-2xl tracking-wide uppercase">
              Hand-Forming
            </h3>
            <p className="font-body text-bakery-brown/70 leading-relaxed">
              No industrial machines. Every loaf and pastry is hand-shaped by our bakers, giving
              each item its own unique, handcrafted soul.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
