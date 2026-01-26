import type { Product } from '@/types/product'

/**
 * Demo mentor data for products
 * Maps product IDs to mentor-focused enhancements
 * Can be toggled on/off with ENABLE_DEMO_DATA flag
 */
export const DEMO_MENTOR_DATA: Record<string, Partial<Product>> = {
  // Anchor Butter
  'k7KIV3aYXZG33EDmEqJg': {
    mentorNote: "I use this at room temperature for the flakiest croissants. The high fat content makes all the difference in laminated doughs.",
    badges: ['sims-secret', 'beginner-friendly'],
    difficultyLevel: 'beginner'
  },

  // Bread Flour
  '3pTEcScO5E9hombgGEmL': {
    mentorNote: "This is my go-to flour for sourdough. The protein content creates strong gluten structure for beautiful oven spring.",
    badges: ['sourdough-essential', 'sims-secret'],
    difficultyLevel: 'intermediate'
  },

  // Add more product mappings as needed
  '1KAQVQF1g9ZnJhslJ2Wd': {
    mentorNote: "Essential for any serious baker. I recommend starting with this before exploring other options.",
    badges: ['beginner-friendly'],
    difficultyLevel: 'beginner'
  },
}

/**
 * Product IDs to mark as featured for Sim's Choice spotlight
 */
export const DEMO_FEATURED_PRODUCT_IDS = [
  'k7KIV3aYXZG33EDmEqJg',
  '3pTEcScO5E9hombgGEmL',
  '1KAQVQF1g9ZnJhslJ2Wd',
]

/**
 * Toggle demo data on/off
 * Set to false to use only Firestore data
 */
const ENABLE_DEMO_DATA = true

/**
 * Enhance products with demo mentor data
 * Non-destructive: only adds fields, doesn't overwrite existing data
 */
export function enhanceWithDemoData(products: Product[]): Product[] {
  if (!ENABLE_DEMO_DATA) return products

  return products.map(product => {
    const demoData = DEMO_MENTOR_DATA[product.id]

    return {
      ...product,
      // Only apply demo data if product doesn't already have the field
      mentorNote: product.mentorNote || demoData?.mentorNote,
      badges: product.badges || demoData?.badges,
      difficultyLevel: product.difficultyLevel || demoData?.difficultyLevel,
      // Mark as featured if in the featured list (or already featured)
      featured: product.featured || DEMO_FEATURED_PRODUCT_IDS.includes(product.id),
    }
  })
}
