'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { Product } from '@/types/product'
import Button from '@/components/ui/Button'
import ProductBadge from './ProductBadge'
import { logProductView, logOrderIntent } from '@/lib/firebase/analytics'
import { useCart } from '@/lib/cart/CartContext'

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
  const { addItem } = useCart()
  const [qty, setQty] = useState(1)

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

  // Reset the quantity picker each time a different product is opened
  useEffect(() => {
    setQty(1)
  }, [product?.id])

  if (!isOpen || !product) return null

  const handleAddToCart = () => {
    logOrderIntent(product.id, product.name, product.price ?? 0)
    addItem(product, qty)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal Content */}
      <div className="relative bg-paper shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-paper/90 hover:bg-white text-ink border border-line rounded-full p-2 transition-colors duration-200"
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
          <div className="relative h-64 md:h-full min-h-[300px] bg-clay/10">
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
              <h2 className="font-heading text-ink text-4xl md:text-5xl leading-tight animate-fade-in">
                {product.name}
              </h2>

              {/* Sim's Tip — only ever a real note someone actually entered for
                  this product (e.g. via Firestore); never a generic fallback
                  quote invented and attributed to Sim. */}
              {product.mentorNote && (
                <div className="bg-sand border-l border-clay p-4 animate-fade-in-delayed">
                  <p className="italic text-ink/80 font-body text-sm">
                    &quot;Sim&apos;s Tip: {product.mentorNote}&quot;
                  </p>
                </div>
              )}

              {/* Description */}
              <p className="font-body text-ink/70 leading-relaxed text-base animate-fade-in-delayed">
                {product.description}
              </p>
            </div>

            {/* PSYCHOLOGY: Quality Commitment - Positive Reframing */}
            <div className="mt-6 p-4 bg-sand border border-line">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-body font-semibold text-clay text-[10px] tracking-widest uppercase">
                  Our Quality Promise
                </h4>
              </div>
              <p className="font-body text-ink/60 text-[11px] leading-relaxed">
                To ensure the absolute freshness of our artisan supplies,
                <span className="text-ink/80 font-medium"> all sales are final and non-refundable.</span> Thank you for trusting our craft.
              </p>
            </div>

            {/* Total Value & CTA Footer */}
            <div className="mt-6 pt-6 border-t border-ink/10">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-ink/50 font-body">
                    Total Value
                  </p>
                  <span className="font-heading text-4xl text-ink">
                    {product.price !== undefined ? `RM ${product.price.toFixed(2)}` : 'Ask for price'}
                  </span>
                </div>
              </div>

              {product.inStock && (
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-[10px] uppercase tracking-widest text-ink/50 font-body">Qty</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 flex items-center justify-center border border-line text-ink hover:border-ink transition-colors"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="text-sm w-6 text-center">{qty}</span>
                    <button
                      onClick={() => setQty((q) => Math.min(99, q + 1))}
                      className="w-8 h-8 flex items-center justify-center border border-line text-ink hover:border-ink transition-colors"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                className="w-full py-5"
                disabled={!product.inStock}
              >
                {product.inStock ? 'Add to cart' : 'Out of stock'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
