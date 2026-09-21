import type { Metadata } from 'next'
import LocationSection from '@/components/sections/LocationSection'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: '/location',
  title: 'Location & Contact | Sim Baking House',
  description:
    'Visit Sim Baking House in Penang. Find our location, opening hours, and contact information.',
})

export default function LocationPage() {
  return (
    <main className="min-h-screen">
      <LocationSection />
    </main>
  )
}
