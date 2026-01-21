import HeroSection from '@/components/sections/HeroSection'
import WhyChooseUsSection from '@/components/sections/WhyChooseUsSection'
import CategoryNavigationSection from '@/components/sections/CategoryNavigationSection'
import FeaturedProductsSection from '@/components/sections/FeaturedProductsSection'
import BakersJourneySection from '@/components/sections/BakersJourneySection'
import TestimonialsSection from '@/components/sections/TestimonialsSection'
import InstagramGridSection from '@/components/sections/InstagramGridSection'
import LocationPreviewSection from '@/components/sections/LocationPreviewSection'
import StickyOrderButton from '@/components/ui/StickyOrderButton'

export default function Home() {
  return (
    <main>
      {/* 1. Hero Section - High-impact video background */}
      <HeroSection />

      {/* 2. Why Choose Us - Establish trust immediately */}
      <WhyChooseUsSection />

      {/* 3. Category Navigation - Help users find what they want */}
      <CategoryNavigationSection />

      {/* 4. Featured Products - Top 3 essentials */}
      <FeaturedProductsSection />

      {/* 5. Baker's Journey - Story snippet for connection */}
      <BakersJourneySection />

      {/* 6. Testimonials - Social proof and trust */}
      <TestimonialsSection />

      {/* 7. Instagram Feed - Visual hunger and freshness proof */}
      <InstagramGridSection />

      {/* 8. Location Preview - Opening hours & directions */}
      <LocationPreviewSection />

      {/* Sticky Order Button - Mobile CTA */}
      <StickyOrderButton />
    </main>
  )
}
