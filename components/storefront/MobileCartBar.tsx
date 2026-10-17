'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart/CartContext'
import { useLang } from '@/lib/i18n/LangContext'

// Phone-only bar: cart count + total + the cart's own "continue to order"
// action. It sits above the home indicator (safe area) and a spacer of the
// same height is added at the end of the page, so it never covers content.
// Other fixed bottom buttons lift above it via --mobile-cart-bar-h.
const BAR_PX = 64

export default function MobileCartBar() {
  const { itemCount, subtotal, hasUnpricedItems, isDrawerOpen } = useCart()
  const { t } = useLang()
  const pathname = usePathname()
  const router = useRouter()
  const visible = itemCount > 0 && !isDrawerOpen && pathname !== '/checkout'

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--mobile-cart-bar-h', visible ? `calc(${BAR_PX}px + env(safe-area-inset-bottom))` : '0px')
    return () => root.style.setProperty('--mobile-cart-bar-h', '0px')
  }, [visible])

  if (!visible) return null
  return (
    <>
      <div className="md:hidden" style={{ height: `calc(${BAR_PX}px + env(safe-area-inset-bottom))` }} aria-hidden="true" data-testid="mobile-cart-spacer" />
      <div
        className="md:hidden fixed inset-x-0 bottom-0 z-[60] bg-ink text-paper border-t border-ink shadow-[0_-4px_16px_rgba(0,0,0,0.15)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        data-testid="mobile-cart-bar"
      >
        <div className="flex items-center justify-between gap-3 px-4" style={{ height: BAR_PX }}>
          <div className="min-w-0">
            <p className="text-xs text-paper/75">{itemCount === 1 ? t('sticky.item') : t('sticky.items', { n: itemCount })}</p>
            <p className="font-heading text-xl leading-tight">
              RM {subtotal.toFixed(2)}
              {hasUnpricedItems && <span className="text-xs text-paper/75"> +</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/checkout')}
            className="bg-paper text-ink px-6 min-h-[44px] text-xs font-semibold uppercase tracking-[0.18em]"
            data-testid="mobile-cart-checkout"
          >
            {t('sticky.checkout')}
          </button>
        </div>
      </div>
    </>
  )
}
