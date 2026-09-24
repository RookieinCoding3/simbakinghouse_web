'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { useCart } from '@/lib/cart/CartContext'

export default function CartDrawer() {
  const { items, subtotal, hasUnpricedItems, isDrawerOpen, closeDrawer, setQty, removeItem } =
    useCart()
  const router = useRouter()

  const handleContinue = () => {
    closeDrawer()
    router.push('/checkout')
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] transition-all duration-700',
        isDrawerOpen ? 'visible' : 'invisible'
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-paper/60 backdrop-blur-xl transition-opacity duration-500',
          isDrawerOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={closeDrawer}
      />

      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 w-[85%] max-w-md bg-paper p-8 md:p-10 flex flex-col transition-transform duration-500 ease-out shadow-2xl',
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex justify-between items-center mb-10">
          <h2 className="font-heading text-ink text-3xl md:text-4xl">Cart</h2>
          <button
            onClick={closeDrawer}
            className="w-10 h-10 flex items-center justify-center text-ink/50 hover:text-clay transition-colors"
            aria-label="Close cart"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted">Your cart is empty.</p>
        ) : (
          <div className="flex-1 space-y-6 overflow-y-auto">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-4">
                <div className="relative w-16 h-16 flex-shrink-0 bg-white border border-line overflow-hidden">
                  <Image src={item.imageUrl || '/images/placeholder-product.jpg'} alt={item.name} fill sizes="64px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wider text-ink font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {item.unitPrice !== null ? `RM ${item.unitPrice.toFixed(2)}` : 'Ask for price'}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => setQty(item.productId, item.qty - 1)}
                      className="w-6 h-6 flex items-center justify-center border border-line text-ink hover:border-ink transition-colors"
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      −
                    </button>
                    <span className="text-xs w-4 text-center">{item.qty}</span>
                    <button
                      onClick={() => setQty(item.productId, item.qty + 1)}
                      className="w-6 h-6 flex items-center justify-center border border-line text-ink hover:border-ink transition-colors"
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-[10px] uppercase tracking-widest text-muted hover:text-clay transition-colors ml-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="pt-8 mt-8 border-t border-ink/10">
            <div className="flex justify-between items-baseline mb-1">
              <p className="text-xs uppercase tracking-widest text-ink/70">Subtotal</p>
              <p className="font-heading text-2xl text-ink">RM {subtotal.toFixed(2)}</p>
            </div>
            {hasUnpricedItems && (
              <p className="text-[11px] text-muted mb-4">
                Some items are priced on request — Sim will confirm the total.
              </p>
            )}
            <button
              onClick={handleContinue}
              className="w-full bg-ink text-paper py-4 font-body font-medium text-xs uppercase tracking-[0.2em] hover:bg-clay transition-colors mt-4"
            >
              Continue to order
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
