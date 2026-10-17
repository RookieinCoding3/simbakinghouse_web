'use client'

import { createContext, useContext, useMemo } from 'react'
import type { SaleEventPromo } from '@/lib/promotions/types'
import { BADGE_COLORS } from '@/lib/promotions/types'
import { applyPromos, badgeFor, promoUnitPrice } from '@/lib/promotions/engine'
import { useCart } from '@/lib/cart/CartContext'
import { cartLineKey } from '@/types/cart'
import { useLang } from '@/lib/i18n/LangContext'
import { cn } from '@/lib/utils/cn'

const Ctx = createContext<SaleEventPromo[]>([])

/** Sale events for the shop (fetched once by the layout, public read). */
export function PromotionsProvider({ promos, children }: { promos: SaleEventPromo[]; children: React.ReactNode }) {
  return <Ctx.Provider value={promos}>{children}</Ctx.Provider>
}

export const klToday = () => new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)

export function usePromos() {
  return useContext(Ctx)
}

/** The live badge for a product, and its sale price (if % off). */
export function useProductPromo(productId: string, unitPriceSen: number | null) {
  const promos = usePromos()
  return useMemo(() => {
    const badge = badgeFor(productId, promos, klToday())
    const salePriceSen = badge?.discountPercent && unitPriceSen !== null ? promoUnitPrice(unitPriceSen, badge.discountPercent) : null
    return { badge, salePriceSen }
  }, [productId, unitPriceSen, promos])
}

export function PromoBadge({ productId, className }: { productId: string; className?: string }) {
  const { badge } = useProductPromo(productId, null)
  const { pick } = useLang()
  if (!badge) return null
  const c = BADGE_COLORS[badge.badgeColor]
  return (
    <span className={cn('text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 shadow-sm', className)} style={{ background: c.bg, color: c.fg }} data-testid="promo-badge">
      {pick(badge.badgeTextEn, badge.badgeTextZh)}
    </span>
  )
}

/** The cart priced with sale events (same function the server uses). */
export function useCartPricing() {
  const { items } = useCart()
  const promos = usePromos()
  return useMemo(
    () =>
      applyPromos(
        items.map((i) => ({ key: cartLineKey(i), productId: i.productId, qty: i.qty, unitPriceSen: i.unitPrice === null ? null : Math.round(i.unitPrice * 100) })),
        promos,
        klToday(),
      ),
    [items, promos],
  )
}

/** Discount lines + "add N more" / "almost there" prompts, for cart and checkout. */
export function CartPromoLines({ className }: { className?: string }) {
  const r = useCartPricing()
  const { lang, t } = useLang()
  if (!r.discounts.length && !r.mixMatchPrompts.length && !r.thresholdPrompt) return null
  return (
    <div className={cn('space-y-1.5', className)} data-testid="cart-promos">
      {r.discounts.map((d) => (
        <div key={d.promoId} className="flex justify-between text-sm text-[#1F5E3B]" data-testid="cart-discount">
          <span>🎉 {d.name}</span>
          <span>−RM {(d.discountSen / 100).toFixed(2)}</span>
        </div>
      ))}
      {r.mixMatchPrompts.map((p) => (
        <p key={p.promoId} className="text-xs bg-[#FFFAEB] border border-[#FEC84B] text-[#7A2E0E] px-3 py-2" data-testid="mixmatch-prompt">
          {lang === 'zh' ? p.textZh : p.textEn}
        </p>
      ))}
      {r.thresholdPrompt && (
        <p className="text-xs bg-[#FFFAEB] border border-[#FEC84B] text-[#7A2E0E] px-3 py-2" data-testid="threshold-prompt">
          {t('promo.almost', { amount: (r.thresholdPrompt.remainingSen / 100).toFixed(2), off: (r.thresholdPrompt.discountSen / 100).toFixed(2) })}
        </p>
      )}
    </div>
  )
}
