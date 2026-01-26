'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import type { Product } from '@/types/product'
import { cn } from '@/lib/utils/cn'
import Button from '@/components/ui/Button'
import ProductBadge from './ProductBadge'

interface ProductModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

function getProductBenefits(product: Product) {
  const benefits: { icon: string; text: string }[] = []

  if (product.difficultyLevel === 'beginner') {
    benefits.push({ icon: '🌱', text: 'Perfect for beginners' })
  }

  if (product.badges?.includes('sourdough-essential')) {
    benefits.push({ icon: '🍞', text: 'Essential for sourdough baking' })
  }

  if (product.featured) {
    benefits.push({ icon: '⭐', text: 'Handpicked by Sim' })
  }

  // Generic benefits
  benefits.push(
    { icon: '✓', text: 'Premium quality ingredients' },
    { icon: '✓', text: 'Available for pre-order' }
  )

  return benefits
}

export default function ProductModal({
  product,
  isOpen,
  onClose,
}: ProductModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !product) return null

  const handleOrderNow = () => {
    // Direct link to Google Form
    const formUrl = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL || 'https://forms.gle/AufdJFLrqhPzSh61A'
    window.open(formUrl, '_blank', 'noopener,noreferrer')
  }

  const benefits = getProductBenefits(product)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bakery-brown/90 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal Content */}
      <div className="relative bg-bakery-cream rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in paper-texture">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-bakery-brown/80 hover:bg-bakery-brown text-bakery-cream rounded-full p-2 transition-colors duration-200"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Product Image */}
          <div className="relative h-64 md:h-full min-h-[300px] bg-bakery-accent/10">
            <Image
              src={product.imageUrl || '/images/placeholder-product.jpg'}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>

          {/* Product Details */}
          <div className="p-6 md:p-8 space-y-5">
            {/* Product Name & Badges */}
            <div className="space-y-3">
              <h2 className="font-heading text-bakery-brown text-2xl md:text-3xl lg:text-4xl tracking-wide animate-fade-in">
                {product.name}
              </h2>

              {/* Badges */}
              {product.badges && product.badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.badges.map(badge => (
                    <ProductBadge key={badge} type={badge} size="md" />
                  ))}
                </div>
              )}
            </div>

            {/* Mentor's Road Note - Aesthetic styling */}
            {product.mentorNote && (
              <div className="bg-bakery-accent/5 border-l-2 border-bakery-accent p-4 rounded-r-lg animate-fade-in-delayed">
                <h4 className="font-heading text-bakery-accent text-xs tracking-[0.2em] mb-2 uppercase">Sim&apos;s Road Note</h4>
                <p className="font-body text-bakery-brown/80 italic text-sm leading-relaxed">
                  &quot;{product.mentorNote}&quot;
                </p>
              </div>
            )}

            {/* Price & Stock - Clean aesthetic */}
            <div className="flex items-baseline justify-between border-b border-bakery-brown/10 pb-4 animate-fade-in">
              <span className="font-heading text-bakery-brown text-3xl md:text-4xl">
                RM {product.price.toFixed(2)}
              </span>
              <span className={cn(
                "font-body text-xs uppercase tracking-widest",
                product.inStock ? "text-green-700" : "text-red-700"
              )}>
                {product.inStock ? "● Freshly Available" : "● Out of Stock"}
              </span>
            </div>

            {/* Product Description */}
            <div className="animate-fade-in-delayed">
              <h3 className="font-heading text-bakery-brown text-lg md:text-xl mb-2 tracking-wide">
                Description
              </h3>
              <p className="font-body text-bakery-brown/80 text-sm md:text-base leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Product Info */}
            <div className="bg-bakery-accent/5 rounded-lg p-4 space-y-2 animate-fade-in-delayed-more">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="w-5 h-5 flex items-center justify-center text-bakery-accent text-sm">
                    {benefit.icon}
                  </span>
                  <span className="font-body text-bakery-brown/70 text-sm">
                    {benefit.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Order Button */}
            <div className="pt-2 animate-fade-in-delayed-more">
              <Button
                variant="primary"
                size="lg"
                onClick={handleOrderNow}
                className="w-full text-base md:text-lg tracking-widest hover-scale"
                disabled={!product.inStock}
              >
                {product.inStock ? 'ORDER NOW' : 'OUT OF STOCK'}
              </Button>
              <p className="font-body text-bakery-brown/60 text-xs text-center mt-3">
                You&apos;ll be redirected to our order form
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
