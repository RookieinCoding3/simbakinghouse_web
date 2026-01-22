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

  return (
    <section className="py-16 md:py-24 bg-bakery-dark paper-texture">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        {/* Section Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <p className="font-body text-bakery-accent text-sm sm:text-base tracking-widest uppercase mb-3">
            Customer Stories
          </p>
          <h2 className="font-heading text-bakery-cream text-4xl sm:text-5xl md:text-6xl mb-4">
            WHAT PEOPLE SAY
          </h2>
          <p className="font-body text-bakery-cream/80 text-lg max-w-2xl mx-auto">
            Hear from our valued customers
          </p>
        </div>

        {/* Testimonial Carousel */}
        <div className="relative">
          {/* Testimonial Card */}
          <div className="bg-bakery-cream rounded-2xl p-8 md:p-12 shadow-2xl min-h-[320px] md:min-h-[280px] flex flex-col justify-between">
            {/* Stars */}
            <div className="flex items-center justify-center space-x-1 mb-6">
              {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                <svg
                  key={i}
                  className="w-6 h-6 text-bakery-accent"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {/* Quote */}
            <blockquote className="text-center mb-8">
              <p className="font-body text-bakery-brown/90 text-lg md:text-xl leading-relaxed italic">
                &ldquo;{testimonials[currentIndex].text}&rdquo;
              </p>
            </blockquote>

            {/* Author */}
            <div className="text-center">
              <p className="font-heading text-bakery-brown text-xl mb-1">
                {testimonials[currentIndex].name}
              </p>
              <p className="font-body text-bakery-brown/60 text-sm">
                {testimonials[currentIndex].location}
              </p>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-12 h-12 rounded-full bg-bakery-accent text-white flex items-center justify-center hover:bg-bakery-accent/90 transition-colors duration-200 shadow-lg"
            aria-label="Previous testimonial"
          >
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-12 h-12 rounded-full bg-bakery-accent text-white flex items-center justify-center hover:bg-bakery-accent/90 transition-colors duration-200 shadow-lg"
            aria-label="Next testimonial"
          >
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center space-x-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-bakery-accent w-8'
                    : 'bg-bakery-cream/40 hover:bg-bakery-cream/60'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
