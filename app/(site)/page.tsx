import dynamic from 'next/dynamic'
import HeroSection from '@/components/sections/HeroSection'
import HowToOrderSection from '@/components/sections/HowToOrderSection'
import AskSimSection from '@/components/storefront/AskSimSection'
import CollectionsSection from '@/components/storefront/CollectionsSection'
import { fetchProducts } from '@/lib/firebase/products'
import { groupByCollection } from '@/lib/storefront/collections'
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
export default async function Home() {
  const products = await fetchProducts().catch(() => [])
  const groups = groupByCollection(products).map((g) => ({
    id: g.id,
    products: g.products.slice(0, 4).map((p) => ({ id: p.id, name: p.name, nameZh: p.nameZh, imageUrl: p.imageUrl })),
  }))
  // "New to baking? Start here": the first-timers collection if Sim has
  // filled it, otherwise straight to Ask Sim.
  const startHref = groups.some((g) => g.id === 'first-time') ? '/products?collection=first-time' : '#ask-sim'
  return (
    <main>
      <HeroSection startHref={startHref} />
      <HowToOrderSection />
      <CollectionsSection groups={groups} />
      <CategoryNavigationSection />
      <AskSimSection />
      <FeaturedProductsSection />
      <BakersJourneySection />
      <WhyChooseUsSection />
      <GetInTouchSection />
    </main>
  )
}
