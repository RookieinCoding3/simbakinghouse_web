const BENEFITS = [
  {
    title: 'Premium quality',
    description: 'Stocked from the same suppliers Penang bakeries use.',
  },
  {
    title: 'Ask Sim',
    description: "Tell her what you're baking and she'll pick the right premix.",
  },
  {
    title: 'Complete range',
    description: 'Flour, premix, tools, decorations. One stop, no second shop.',
  },
  {
    title: 'Fresh stock',
    description: 'Expiry date on every label. We pull stock before it turns.',
  },
  {
    title: 'Fair prices',
    description: 'Retail prices online. Bulk rates for regular bakers, just ask.',
  },
]

export default function WhyChooseUsSection() {
  return (
    <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-24 border-b border-line">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        <div className="lg:col-span-4 space-y-6">
          <h2 className="text-xs uppercase tracking-[0.25em] font-semibold text-ink">Why Sim Baking House</h2>
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
