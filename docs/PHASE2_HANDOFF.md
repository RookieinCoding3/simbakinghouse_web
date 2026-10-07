# Phase 2 handoff — inventory core

Status as of 2026-10-07. Branch: `phase2-inventory` (local only, not pushed).
`main` and production are at `ac3fcdb` (Roles phase + the "Ask for price"
hotfix, merged into this branch as `f3a861c`). **Nothing from Phase 2 is
deployed**: no code, no Firestore rules, no Firestore indexes.

## Progress log (step 2, updated after every sub-step)

| Sub-step | Status | Commit |
|---|---|---|
| a. Admin order page → transition route | **DONE** | see `git log` ("2a") |
| b. Product editor form | **DONE** | see `git log` ("2b") |
| c. Quick sale screen `/admin/sale` | not started | |
| d. Stock-tab badge | not started | |
| e. Browser pass (WebKit 390/1440) + browser tests | not started | |
| f. Lighthouse + bundle sizes | not started | |
| g. Final handoff update + deploy plan | not started | |

**Next action if picking this up cold:** start the first row that is not DONE.

---

## Decisions (from the owner, and how they were built)

| Decision | How it's implemented |
|---|---|
| **Hold on confirm** | `POST /api/admin/orders/[orderId]/transition` with `to: "confirmed"` creates `reserve` movements and raises `reservedMilli`, in one transaction with the status change. Fails with 409 naming each short item ("Rice flour (need 9 kg, only 7.5 kg available)"). |
| **Deduct on collect** | `to: "collected"` converts the hold into a `sale`: lowers `onHandMilli` and `reservedMilli`, first-expiry-first-out from batches. |
| **Release on cancel** | `to: "cancelled"` releases the hold. |
| **Idempotent steps** | The order's `status` and `stock.state` record what already happened; repeating a step is a no-op (tested with simultaneous double calls). Adjustments, counts and switches carry a client `opId`; walk-in sales a client `saleId`. |
| **Transition mode** (`managedStock`) | Missing field = unmanaged. Unmanaged products sell exactly as before (manual `inStock`, no status, no checks, legacy `stockCount` decrement on collect). **No migration**: an inventory doc is created only when a product is switched on, which requires a completed count (draft in `stockCountDrafts/{id}`, 0 allowed) and an explicit "old system no longer used" confirmation. Switching off keeps inventory and history. |
| **Status-only for customers** | Public `products/{id}.stockStatus` = `in_stock` / `low` / `out`, derived by the server in the same transaction as every stock change, for managed products only. Quantities live only in `inventory`, `stockMovements`, `batches` (admin/owner read, no client writes). Customer error messages never contain numbers. |
| **Roles** | Admin and owner can both do everything in Phase 2; only "admin" manages users (Roles phase, already live). Every Phase 2 route uses `requireAdmin()` and writes an `auditLog` entry in its transaction. |
| **Units** | Stock is integer **milli-units** of the product's base unit (`pc`, `kg`, `g`, `L`, `ml`, `bag`, `box`, `pack`, `tin`, `bottle`). Money is integer **sen**. Sell units: `{ id, label, factorMilli, priceSen, channel }`. |
| **Wholesale prices stay private** | Wholesale-only sell units are stored in `productPrivate/{id}` (admin/owner only). The public product doc only has `hasWholesale: true`; the shop shows "Ask on WhatsApp for wholesale". (Phase 2B's `costSen` should go in the same doc.) |
| **Old products and orders** | Read without migration. A product with no `sellUnits` field gets one default unit priced from its legacy `price` float; old orders without `baseQtyMilli` are read as `qty × 1 unit`. |

---

## Item status

| Item | Status | Files |
|---|---|---|
| Stock engine (pure maths, FEFO, invariants) | **DONE** | `lib/inventory/engine.ts`, `lib/inventory/units.ts`, `lib/inventory/catalog.ts`, `lib/money.ts` |
| Stock transactions (server) | **DONE** | `lib/server/stock.ts` (StockSession), `lib/server/lines.ts`, `lib/server/http.ts`, `lib/time.ts` |
| Stock-aware customer orders | **DONE** | `app/api/orders/route.ts`, `lib/orderValidation.ts`, `types/order.ts` |
| Stock-aware admin order steps (server) | **DONE** | `app/api/admin/orders/[orderId]/transition/route.ts` |
| Stock-aware admin order steps (**UI**) | **DONE** (2a) | `orders/[orderId]/page.tsx` calls the transition route for every step (sends `confirmedTotalSen`, shows the 409 `short` list), shows each line's size and the stock state. No browser writes. Tested in WebKit: `scripts/admin-orders.test.mjs` (8) |
| Adjust / count / switch / consistency check (server) | **DONE** | `app/api/admin/stock/{adjust,count,manage,check}/route.ts` |
| managedStock transition mode | **PARTIAL** | server DONE and tested; UI written but never rendered or browser-tested: `stock/[productId]/page.tsx` (SwitchOn/SwitchOff), `stock/switch/page.tsx` |
| Customer stock status | **PARTIAL** | data side DONE and tested; shop UI written but not browser-tested: `lib/productView.ts`, `components/products/ProductCard.tsx`, `components/products/ProductModal.tsx`, `lib/firebase/products.ts`, `types/product.ts`, `lib/structuredData.ts` |
| Cart and checkout with sizes | **PARTIAL** | written, not browser-tested: `lib/cart/CartContext.tsx`, `types/cart.ts`, `components/cart/CartDrawer.tsx`, `app/(site)/checkout/page.tsx` |
| Rules for inventory/stockMovements/batches/sales/productPrivate/stockCountDrafts/stockOps; stock fields on products; orders holding stock | **DONE** (tested, not deployed) | `firestore.rules`, `scripts/firestore-rules-roles.test.mjs` |
| Indexes (stock history, today's sales) | **DONE** (not deployed) | `firestore.indexes.json` |
| Stock tab (list, filters, running low, search) | **PARTIAL** | written, not browser-tested: `app/(admin)/admin/(protected)/stock/page.tsx`, `lib/admin/stockView.ts`, `lib/admin/collectionStore.ts`, `lib/admin/productsStore.ts` |
| Product history (ledger) | **PARTIAL** | in `stock/[productId]/page.tsx`, not browser-tested |
| Stock count mode | **PARTIAL** | `stock/count/page.tsx`, not browser-tested |
| Product editor (server) | **DONE** | `app/api/admin/products/route.ts`, `app/api/admin/products/[productId]/route.ts`, `app/api/admin/categories/route.ts`, `lib/server/productInput.ts`, `lib/server/saveProduct.ts` |
| Product editor (**UI**) | **DONE** (2b) | `components/admin/ProductForm.tsx` (calls the product routes; no browser writes), `components/admin/PriceKeypad.tsx` (till-style RM keypad, also typeable). Category dropdown + "Add new category" (EN + optional ZH), sizes editor (name, uses N base units, channel, price on keypad or **Ask for price**), base unit (locked while managed), low level, expiry, barcodes. Stock tracking is switched on from the product's Stock page (needs a count); the editor links there and shows on-shelf/held/available when managed. Products list: In-stock toggle only on unmanaged products, managed show their status. Tested: `scripts/admin-products.test.mjs` (13) |
| Walk-in quick sale (server, incl. oversold, void, FEFO, wholesale) | **DONE** | `app/api/admin/sales/route.ts`, `app/api/admin/sales/[saleId]/void/route.ts` |
| Walk-in quick sale (**UI**) | **NOT STARTED** | `/admin/sale` does not exist; the Stock tab already links to it (404) |
| Stock-tab badge (running low count on the bottom tab) | **NOT STARTED** | `components/admin/AdminShell.tsx` |
| Tests: unit + API end-to-end | **DONE** | `scripts/unit/inventory.test.ts` (23), `scripts/stock.test.mjs` (27) |
| Tests: browser E2E for new screens, screenshots 390/1440, customer-site pixel check, Lighthouse/bundle | **NOT STARTED** | — |

---

## How to run the tests

```bash
npm test                    # everything below, in order
npm run test:rules          # rules (16) + role matrix (215), Firestore emulator
npm run test:guest-checkout # 3
npm run test:unit           # scripts/unit/*.test.ts (inventory 23, normalizeOrder 24)
npm run test:e2e            # builds .next-test against the emulators, then all suites:
                            #   order-abuse 10, admin 29, admin-auth 10, admin-users 18, stock 27
bash scripts/test-env.sh bash scripts/e2e-suites.sh stock      # one suite
# Phase 2 browser suites (WebKit): admin-orders, admin-products
SKIP_BUILD=1 bash scripts/test-env.sh bash scripts/e2e-suites.sh stock   # reuse last test build
```

Everything runs against the Firebase emulators (project `demo-sbh-test`) and a
local build in `.next-test/`; nothing touches production. Ports 8080, 9099,
9199 and 3100 must be free.

Last full run (2026-10-07, on this WIP): all green, 375 checks.

---

## "Ask for price" (no price) rules — apply everywhere

- A sell unit with `priceSen: null` is "Ask for price". A product whose public
  units are all unpriced has **no `price` field** (the shop shows "Ask for price").
- Online orders: accepted, line kept with `unitPriceSnapshot: null`, left out of
  the estimate, order flagged `priceToConfirm` (hotfix `d652d23`, kept in Phase 2).
  The admin must type the full final total before Accept (not prefilled).
- Managed stock applies exactly as for priced products: availability check at
  order time, hold on confirm, deduct on collect, release on cancel (tested in
  `admin-products` suite).
- Quick sale: the seller types the price at the till; it is stored on that sale
  line only (see 2c).
- **Phase 2B promotions must exclude "Ask for price" lines/products**: a
  percentage or fixed discount has nothing to apply to, and a "spend RM X"
  threshold must not count them. Check `unitPriceSen === null` (orders) /
  `priceSen === null` (sell units) / `priceSource === 'till'` (sale lines).

## Known problems (fix before any of this is deployed)

1. ~~Admin order page writes status directly.~~ Fixed in 2a. Note: the
   `orders` rule still lets an admin browser update an order that holds no
   stock. That is deliberate so the code live today keeps working during the
   deploy window (rules ship before code). No Phase 2 screen uses it. Optional
   hardening once Phase 2 code is live: change `orders` to `allow update: if false`.
2. ~~**Old product form vs sell units.**~~ Fixed in 2b. `ProductForm.tsx` writes `price` and
   `stockCount` client-side and knows nothing about `sellUnits`. For a product
   saved by the new editor route, the shop reads `sellUnits`, so a price changed
   in the old form would be **ignored** by the shop. Replace the form with one
   that calls the product routes.
3. **`/admin/sale` link 404s** until the quick-sale screen exists.
4. **New screens are untested in a browser.** They type-check and lint, but have
   never been rendered.
5. **`/products` is cached for 5 minutes (ISR).** A product that just ran out can
   still show as available for up to 5 minutes; the server refuses the order with a
   clear message, so this is cosmetic.
6. **Deploy order matters.** Firestore indexes must be built before the code that
   queries `stockMovements`/`sales` ships, and the rules must ship with or before
   the code. See Next steps.
8. **Rules: "Ask for price" products couldn't be toggled In stock from the
   products list** (`productShapeOk()` demanded `price is number`). Live today
   too. Fixed in the Phase 2 rules (price optional, still a non-negative number
   when present; tested). Goes live with the Phase 2 rules deploy.
7. **Production bug already live (not from Phase 2).** Since `f5d9881`, ordering a
   product with no price ("Ask for price") fails with "no longer available",
   because the server re-pricing rejected unpriced products. The Phase 2 order
   route fixes this (unpriced lines are accepted and left out of the total),
   but the fix is not deployed.

---

## Next steps, in order

1. ~~Wire the admin order page to the transition route~~ (done, 2a).
2. Replace `ProductForm.tsx` with the new editor (problem #2): category dropdown
   with "+ Add new category" (EN, optional ZH; uses `/api/admin/categories`),
   sell units editor (label, factor in base units, price in RM →
   `parseRMToSen`, channel), base unit, low-stock level, track expiry, barcodes.
   Limit the products-list "In stock" toggle to unmanaged products.
3. Build `/admin/sale` (quick sale): search, size and qty, running total, payment
   method, Done with one `saleId` per sale, "Sell anyway" on 409, today's sales
   with Void.
4. Add the running-low badge to the Stock tab in `AdminShell.tsx`.
5. Browser E2E (Playwright, emulator) for: shop status badges, size picker,
   out-of-stock disabled, cart with sizes, checkout; Stock tab filters; adjust
   with confirm line; count mode; switch-over per category; quick sale incl.
   oversold and void; order page confirm/collect/cancel on a managed product.
6. Screenshots at 390 px and 1440 px; customer-site pixel diff
   (`scripts/site-screenshots.mjs`); bundle size and Lighthouse for `/admin` pages
   (flag anything over 250 KB JS).
7. Run `npm test`, then merge `phase2-inventory` into `main`.
8. Deploy in this order: `firebase deploy --only firestore:indexes` (wait until
   the indexes show as built), then `firebase deploy --only firestore:rules`, then
   push `main` to trigger the Vercel build.
9. Hand-test on a real phone: switch one product on with a count, place an order
   for it, confirm/collect it, a walk-in sale, a void.
