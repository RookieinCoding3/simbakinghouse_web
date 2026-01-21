'use client'

export default function WhyChooseUsSection() {
  const benefits = [
    {
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "QUALITY INGREDIENTS",
      description: "We use only the finest ingredients, sourced locally whenever possible, ensuring every bite is pure and delicious."
    },
    {
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "TRADITIONAL METHODS",
      description: "Our baking techniques honor time-tested traditions, creating authentic flavors that modern shortcuts can't replicate."
    },
    {
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: "MADE WITH LOVE",
      description: "Every item is handcrafted with care and attention to detail, infusing each creation with warmth and passion."
    },
    {
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
      title: "FRESH DAILY",
      description: "Everything is baked fresh daily, ensuring you always get the best quality and taste in every purchase."
    },
    {
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "COMMUNITY FOCUSED",
      description: "We're proud to serve our Penang community, building relationships one loaf at a time."
    },
    {
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "GREAT VALUE",
      description: "Quality doesn't have to be expensive. We offer competitive prices without compromising on excellence."
    }
  ]

  return (
    <section className="py-16 md:py-24 bg-bakery-cream paper-texture">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <p className="font-body text-bakery-accent text-sm sm:text-base tracking-widest uppercase mb-3">
            Our Promise
          </p>
          <h2 className="font-heading text-bakery-brown text-4xl sm:text-5xl md:text-6xl mb-4">
            WHY CHOOSE US
          </h2>
          <p className="font-body text-bakery-brown/70 text-lg max-w-2xl mx-auto">
            Discover what makes Sim Baking House special
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-8 text-center hover:shadow-xl transition-all duration-300 hover-scale animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-16 h-16 bg-bakery-accent rounded-full flex items-center justify-center mx-auto mb-6 shimmer">
                {benefit.icon}
              </div>
              <h3 className="font-heading text-bakery-brown text-xl mb-3">
                {benefit.title}
              </h3>
              <p className="font-body text-bakery-brown/70 text-sm leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
