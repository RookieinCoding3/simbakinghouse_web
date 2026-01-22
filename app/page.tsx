import HeroSection from '@/components/sections/HeroSection'
import WhyChooseUsSection from '@/components/sections/WhyChooseUsSection'
import CategoryNavigationSection from '@/components/sections/CategoryNavigationSection'
import FeaturedProductsSection from '@/components/sections/FeaturedProductsSection'
import BakersJourneySection from '@/components/sections/BakersJourneySection'
import TestimonialsSection from '@/components/sections/TestimonialsSection'
import GetInTouchSection from '@/components/sections/GetInTouchSection'
import StickyOrderButton from '@/components/ui/StickyOrderButton'

export default function Home() {
  return (
    <main>
      {/* 1. Hero Section - High-impact video background */}
      <HeroSection />

      {/* 2. Category Navigation - Help users find what they want */}
      <CategoryNavigationSection />

      {/* 3. Why Choose Us - Establish trust and credibility */}
      <WhyChooseUsSection />

      {/* 4. Featured Products - Top 3 essentials */}
      <FeaturedProductsSection />

      {/* 5. Baker's Journey - Story snippet for connection */}
      <BakersJourneySection />

      {/* 6. Testimonials - Social proof and trust */}
      <TestimonialsSection />

      {/* 7. Get In Touch - Multiple contact options */}
      <GetInTouchSection />

      {/* Sticky Order Button - Mobile CTA */}
      <StickyOrderButton />
    </main>
  )
}
