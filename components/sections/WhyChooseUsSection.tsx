'use client'

export default function WhyChooseUsSection() {
  const benefits = [
    {
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "PREMIUM QUALITY",
      description: "We stock only premium baking ingredients and supplies, carefully selected to ensure consistent results for your home baking projects."
    },
    {
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "EXPERT GUIDANCE",
      description: "Sim personally helps every customer find the right products for their needs, sharing tips and recipes from years of baking experience."
    },
    {
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      title: "COMPLETE RANGE",
      description: "From basic flour to specialty premixes, baking tools to decorations - we have everything you need under one roof."
    },
    {
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "FRESH STOCK",
      description: "We maintain fresh inventory and track expiry dates carefully, so you always get the freshest ingredients for perfect results."
    },
    {
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: "PERSONAL SERVICE",
      description: "We remember our regular customers and their preferences, creating a warm family atmosphere where everyone feels welcome."
    },
    {
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "FAIR PRICES",
      description: "Quality baking supplies at honest prices. We believe great ingredients should be affordable for home bakers."
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
