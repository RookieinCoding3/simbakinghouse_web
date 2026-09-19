'use client'

import { useState, useEffect } from 'react'

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const testimonials = [
    {
      name: "Lim Mei Ling",
      location: "Georgetown, Penang",
      text: "I've been coming here for 3 years. Sim is so patient, even when I ask the same questions! She helped me choose the right premix for my daughter's birthday cake. It turned out so fluffy and delicious!",
      rating: 5
    },
    {
      name: "Tan Ah Kow",
      location: "Bayan Lepas, Penang",
      text: "As a home baker, I trust only Sim Baking House for my ingredients. The flour quality is consistent, prices are fair, and Sim always remembers what I usually buy. Feel like family here!",
      rating: 5
    },
    {
      name: "Wong Siew Lan",
      location: "Tanjung Bungah, Penang",
      text: "My kuih business depends on quality ingredients. Sim never disappoints! She even taught me a few tricks to make my kuih lapis more colorful. Very grateful for her kindness and expertise.",
      rating: 5
    },
    {
      name: "Chong Li Ying",
      location: "Air Itam, Penang",
      text: "I was struggling with my mooncake recipe. Sim patiently explained which type of flour I needed and why. Now my mooncakes are selling so well! She's not just selling products, she genuinely cares.",
      rating: 5
    },
    {
      name: "Ooi Beng Huat",
      location: "Jelutong, Penang",
      text: "Been buying from here since they opened. The shop is small but has everything I need. Sim knows all her regular customers by name. That personal touch is hard to find nowadays!",
      rating: 5
    },
    {
      name: "Lee Geok Sim",
      location: "Pulau Tikus, Penang",
      text: "I make pineapple tarts during CNY. Sim always stocks up the right ingredients for me in advance. She even calls to remind me when new premix flavors arrive. Best service!",
      rating: 5
    }
  ]

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const current = testimonials[currentIndex]

  return (
    <section className="bg-sand border-y border-[#E5DDD2] py-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-xs uppercase tracking-[0.25em] font-semibold text-ink">Customer stories</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrev}
                className="w-10 h-10 border border-ink/30 text-ink flex items-center justify-center hover:bg-ink hover:text-paper transition-colors"
                aria-label="Previous testimonial"
              >
                &larr;
              </button>
              <button
                onClick={handleNext}
                className="w-10 h-10 border border-ink/30 text-ink flex items-center justify-center hover:bg-ink hover:text-paper transition-colors"
                aria-label="Next testimonial"
              >
                &rarr;
              </button>
              <span className="text-[11px] tracking-widest text-muted ml-2">
                {String(currentIndex + 1).padStart(2, '0')} / {String(testimonials.length).padStart(2, '0')}
              </span>
            </div>
          </div>

          <figure className="lg:col-span-8 min-h-[260px] flex flex-col justify-between gap-8">
            <blockquote className="font-heading text-2xl sm:text-3xl lg:text-4xl leading-snug text-ink">
              &ldquo;{current.text}&rdquo;
            </blockquote>
            <figcaption className="text-xs">
              <p className="uppercase tracking-widest font-semibold text-ink">{current.name}</p>
              <p className="mt-1 text-muted">{current.location}</p>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
