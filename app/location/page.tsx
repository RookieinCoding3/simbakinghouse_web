import type { Metadata } from 'next'
import LocationSection from '@/components/sections/LocationSection'

export const metadata: Metadata = {
  title: 'Location & Contact | Sim Baking House',
  description:
    'Visit Sim Baking House in Penang. Find our location, opening hours, and contact information.',
  keywords: 'Sim Baking House location, Penang bakery, contact, address, opening hours',
}

export default function LocationPage() {
  return (
    <main className="min-h-screen pt-16 md:pt-20">
      <LocationSection />
    </main>
  )
}
