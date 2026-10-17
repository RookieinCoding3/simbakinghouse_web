import { applyPromos, badgeFor, isLive, promoUnitPrice } from '../../lib/promotions/engine'
import { parsePromotions, PromoError } from '../../lib/promotions/validate'
import type { SaleEventPromo } from '../../lib/promotions/types'
import { test, eq, ok, done } from './harness'

const today = '2026-10-17'
const badge: SaleEventPromo = { id: 'p1', name: 'Butter Clearance', active: true, type: 'PRODUCT_BADGE', badgeConfig: { badgeTextEn: 'CLEARANCE', badgeTextZh: '清仓特价', badgeColor: 'red', productIds: ['butter'], discountPercent: 20 } }
const mix: SaleEventPromo = { id: 'p2', name: '3 for RM25', active: true, type: 'MIX_AND_MATCH', mixMatchConfig: { eligibleProductIds: ['premixA', 'premixB', 'premixC'], requiredQty: 3, bundlePriceSen: 2500, promptTextEn: 'Add {remaining} more item(s) to get 3 for RM25!', promptTextZh: '再加 {remaining} 件！' } }
const spend: SaleEventPromo = { id: 'p3', name: 'RM300 - RM10', active: true, type: 'SPEND_THRESHOLD', thresholdConfig: { minSpendSen: 30000, discountSen: 1000, upsellThresholdSen: 22000 } }
const L = (key: string, productId: string, qty: number, unitPriceSen: number | null) => ({ key, productId, qty, unitPriceSen })

test('live window: active + start/end dates (inclusive)', () => {
  ok(isLive(badge, today), 'active')
  ok(!isLive({ ...badge, active: false }, today), 'off')
  ok(!isLive({ ...badge, startDate: '2026-10-18' }, today), 'not started')
  ok(isLive({ ...badge, endDate: today }, today), 'last day')
  ok(!isLive({ ...badge, endDate: '2026-10-16' }, today), 'ended')
})

test('badge: shown on its products; % off per unit, rounded to the sen', () => {
  eq(badgeFor('butter', [badge], today)?.badgeTextEn, 'CLEARANCE')
  eq(badgeFor('flour', [badge], today), null)
  eq(promoUnitPrice(1290, 20), 1032)
  const r = applyPromos([L('b', 'butter', 2, 1290), L('f', 'flour', 1, 450)], [badge], today)
  eq([r.subtotalSen, r.totalDiscountSen, r.totalSen], [3030, 516, 2514])
})

test('mix & match: full groups at the bundle price, dearest first; prompt for the rest', () => {
  const r = applyPromos([L('a', 'premixA', 2, 1290), L('b', 'premixB', 1, 1390), L('c', 'premixC', 1, 990)], [mix], today)
  // units 1390, 1290, 1290 | 990 -> one group 3970 for 2500 = 1470 off; 990 left over
  eq(r.totalDiscountSen, 1470)
  eq(r.mixMatchPrompts.map((p) => [p.remaining, p.textEn]), [[2, 'Add 2 more item(s) to get 3 for RM25!']])
  eq(applyPromos([L('a', 'premixA', 1, 500), L('b', 'premixB', 2, 500)], [mix], today).totalDiscountSen, 0, 'never more expensive than buying separately')
})

test('spend threshold: on the total after other discounts; upsell when close', () => {
  eq(applyPromos([L('x', 'flour', 70, 450)], [spend], today).discounts.map((d) => d.discountSen), [1000]) // 31500
  const near = applyPromos([L('x', 'flour', 50, 450)], [spend], today) // 22500
  eq([near.totalDiscountSen, near.thresholdPrompt?.remainingSen], [0, 7500])
  eq(applyPromos([L('x', 'flour', 10, 450)], [spend], today).thresholdPrompt, null, 'too far: no nagging')
  // 20% off butter brings 30960 under 30000: no threshold discount.
  eq(applyPromos([L('b', 'butter', 24, 1290)], [badge, spend], today).discounts.map((d) => d.promoId), ['p1'])
})

test('unpriced ("Ask for price") lines never get or count toward a discount', () => {
  const r = applyPromos([L('b', 'butter', 1, null), L('a', 'premixA', 3, null)], [badge, mix, spend], today)
  eq([r.subtotalSen, r.totalDiscountSen], [0, 0])
})

test('validation: tolerant on read (bad entries dropped), strict on save', () => {
  const doc = parsePromotions({ promos: [badge, mix, spend, { id: 'x', name: 'bad', type: 'NOPE' }, null] })
  eq(doc.promos.map((p) => p.id), ['p1', 'p2', 'p3'])
  let msg = ''
  try { parsePromotions({ promos: [{ ...badge, badgeConfig: { ...badge.badgeConfig, productIds: [] } }] }, true) } catch (e) { msg = e instanceof PromoError ? e.message : 'other' }
  ok(msg.includes('choose at least one product'), msg)
  try { parsePromotions({ promos: [{ ...spend, thresholdConfig: { minSpendSen: 1000, discountSen: 1000, upsellThresholdSen: 0 } }] }, true); msg = '' } catch (e) { msg = (e as Error).message }
  ok(msg.includes('less than the minimum'), msg)
  eq(parsePromotions(undefined).promos, [])
})

done()
