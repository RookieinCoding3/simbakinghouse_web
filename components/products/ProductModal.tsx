'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import type { Product } from '@/types/product'
import Button from '@/components/ui/Button'

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
    window.open('https://forms.gle/AufdJFLrqhPzSh61A', '_blank', 'noopener,noreferrer')
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
          <div className="p-6 md:p-8 space-y-6">
            {/* Product Name */}
            <div>
              <h2 className="font-heading text-bakery-brown text-3xl md:text-4xl tracking-wide animate-fade-in">
                {product.name}
              </h2>
            </div>

            {/* Divider */}
            <div className="border-t border-bakery-brown/20 animate-fade-in-delayed"></div>

            {/* Product Description */}
            <div className="animate-fade-in-delayed">
              <h3 className="font-heading text-bakery-brown text-xl mb-3 tracking-wide">
                Description
              </h3>
              <p className="font-body text-bakery-brown/80 text-base leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Product Info */}
            <div className="bg-bakery-accent/10 rounded-lg p-4 space-y-2 animate-fade-in-delayed-more">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-bakery-accent"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-body text-bakery-brown/80 text-sm">
                  Handcrafted with premium ingredients
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-bakery-accent"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-body text-bakery-brown/80 text-sm">
                  Freshly baked daily
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-bakery-accent"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-body text-bakery-brown/80 text-sm">
                  Available for pre-order
                </span>
              </div>
            </div>

            {/* Order Button */}
            <div className="pt-4 animate-fade-in-delayed-more">
              <Button
                variant="primary"
                size="lg"
                onClick={handleOrderNow}
                className="w-full text-lg tracking-widest hover-scale"
              >
                ORDER NOW
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
