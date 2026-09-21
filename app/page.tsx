import dynamic from 'next/dynamic'
import HeroSection from '@/components/sections/HeroSection'
import WhyChooseUsSection from '@/components/sections/WhyChooseUsSection'
import CategoryNavigationSection from '@/components/sections/CategoryNavigationSection'
import FeaturedProductsSection from '@/components/sections/FeaturedProductsSection'
import BakersJourneySection from '@/components/sections/BakersJourneySection'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({ path: '/' })

// Lazy load below-fold sections
const TestimonialsSection = dynamic(() => import('@/components/sections/TestimonialsSection'), {
  ssr: true,
})
const GetInTouchSection = dynamic(() => import('@/components/sections/GetInTouchSection'), {
  ssr: true,
})

export default function Home() {
  return (
    <main>
      <HeroSection />
      <CategoryNavigationSection />
      <BakersJourneySection />
      <FeaturedProductsSection />
      <WhyChooseUsSection />
      <TestimonialsSection />
      <GetInTouchSection />
    </main>
  )
}
