const BENEFITS = [
  {
    title: 'Premium quality',
    description:
      'Only premium baking ingredients and supplies, carefully selected to ensure consistent results for your home baking projects.',
  },
  {
    title: 'Expert guidance',
    description:
      'Sim personally helps every customer find the right products, sharing tips and recipes from years of baking experience.',
  },
  {
    title: 'Complete range',
    description:
      'From basic flour to specialty premixes, baking tools to decorations — everything you need under one roof.',
  },
  {
    title: 'Fresh stock',
    description:
      'We track expiry dates carefully, so you always get the freshest ingredients for perfect results.',
  },
  {
    title: 'Personal service',
    description:
      'We remember our regulars and their preferences, creating a warm family atmosphere where everyone feels welcome.',
  },
  {
    title: 'Fair prices',
    description:
      'Quality baking supplies at honest prices. Great ingredients should be affordable for home bakers.',
  },
]

export default function WhyChooseUsSection() {
  return (
    <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-24 border-b border-line">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        <div className="lg:col-span-4 space-y-6">
          <h2 className="text-xs uppercase tracking-[0.25em] font-semibold text-ink">Why Sim Baking House</h2>
          <p className="font-heading text-3xl sm:text-4xl leading-tight text-ink">
            A small shop with a simple promise.
          </p>
        </div>

        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {BENEFITS.map((benefit, index) => (
            <div key={benefit.title} className="border-t border-line pt-5 space-y-3">
              <p className="text-[11px] tracking-widest text-clay font-medium">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="text-[11px] uppercase tracking-wider text-[#3D3A37] font-semibold">
                {benefit.title}
              </h3>
              <p className="text-xs text-muted leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
