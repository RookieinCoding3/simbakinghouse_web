'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import type { Product } from '@/types/product'
import Button from '@/components/ui/Button'
import ProductBadge from './ProductBadge'
import { logProductView, logOrderIntent } from '@/lib/firebase/analytics'

interface ProductModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export default function ProductModal({
  product,
  isOpen,
  onClose,
}: ProductModalProps) {
  // Track which product was last logged to prevent duplicates
  const lastLoggedProductId = useRef<string | null>(null)

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Track product view for business intelligence
  useEffect(() => {
    if (isOpen && product && product.id !== lastLoggedProductId.current) {
      lastLoggedProductId.current = product.id
      logProductView(product.id, product.name, product.category)
    }
  }, [isOpen, product])

  if (!isOpen || !product) return null

  const handleOrderNow = () => {
    // Track order intent for business intelligence
    if (product) {
      logOrderIntent(product.id, product.name, product.price)
    }
    const formUrl = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL || 'https://forms.gle/AufdJFLrqhPzSh61A'
    window.open(formUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bakery-brown/90 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal Content */}
      <div className="relative bg-bakery-cream rounded-sm shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
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
          <div className="flex flex-col h-full p-6 md:p-8">
            <div className="flex-1 space-y-6">
              {/* Badges */}
              {product.badges && product.badges.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {product.badges.map(badge => (
                    <ProductBadge key={badge} type={badge} size="md" />
                  ))}
                </div>
              )}

              {/* Product Name */}
              <h2 className="font-heading text-bakery-brown text-3xl md:text-4xl tracking-tight uppercase animate-fade-in">
                {product.name}
              </h2>

              {/* Mentor Note - Personalized and supportive */}
              <div className="bg-bakery-accent/5 border-l-2 border-bakery-accent p-4 rounded-r-sm animate-fade-in-delayed">
                <p className="italic text-bakery-brown/80 font-body text-sm">
                  &quot;Sim&apos;s Tip: {product.mentorNote || "A premium essential for your home kitchen."}&quot;
                </p>
              </div>

              {/* Description */}
              <p className="font-body text-bakery-brown/70 leading-relaxed text-base animate-fade-in-delayed">
                {product.description}
              </p>
            </div>

            {/* Total Value & Terms Footer */}
            <div className="mt-8 pt-6 border-t border-bakery-brown/10">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-bakery-brown/40 font-heading">
                    Price
                  </p>
                  <span className="font-heading text-3xl md:text-4xl text-bakery-brown">
                    RM {product.price.toFixed(2)}
                  </span>
                </div>

                {/* MANDATORY POLICY */}
                <div className="text-right max-w-[140px]">
                  <p className="text-[8px] md:text-[9px] text-bakery-brown/50 font-body uppercase leading-tight italic">
                    * Important: All goods sold are non-refundable.
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleOrderNow}
                className="w-full py-4 md:py-5 text-lg tracking-[0.2em] shadow-xl hover:scale-[1.01] transition-transform"
                disabled={!product.inStock}
              >
                {product.inStock ? 'ADD TO MY ORDER' : 'OUT OF STOCK'}
              </Button>

              <p className="font-body text-bakery-brown/50 text-xs text-center mt-3">
                You&apos;ll be redirected to our order form
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
