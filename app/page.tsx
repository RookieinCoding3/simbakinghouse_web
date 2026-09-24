import dynamic from 'next/dynamic'
import HeroSection from '@/components/sections/HeroSection'
import WhyChooseUsSection from '@/components/sections/WhyChooseUsSection'
import CategoryNavigationSection from '@/components/sections/CategoryNavigationSection'
import FeaturedProductsSection from '@/components/sections/FeaturedProductsSection'
import BakersJourneySection from '@/components/sections/BakersJourneySection'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({ path: '/' })

// Lazy load below-fold sections
const GetInTouchSection = dynamic(() => import('@/components/sections/GetInTouchSection'), {
  ssr: true,
})

// TestimonialsSection is intentionally not rendered: all six quotes in it
// read as generated placeholder content (same pattern as the fabricated
// mentor quotes removed from lib/demo/mentorData.ts), not confirmed real
// customers. The component file is left in place in case any are
// confirmed real and the owner wants to restore a subset — see
// components/sections/TestimonialsSection.tsx.
export default function Home() {
  return (
    <main>
      <HeroSection />
      <CategoryNavigationSection />
      <BakersJourneySection />
      <FeaturedProductsSection />
      <WhyChooseUsSection />
      <GetInTouchSection />
    </main>
  )
}
