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
| c. Quick sale screen `/admin/sale` | **DONE** | see `git log` ("2c") |
| d. Stock-tab badge | **DONE** | see `git log` ("2d") |
| e. Browser pass (WebKit 390/1440) + browser tests | **DONE** | see `git log` ("2e") |
| f. Lighthouse + bundle sizes | **DONE** | see `git log` ("2f") |
| g. Final handoff update + deploy plan | **DONE** | see `git log` ("2g") |

**Phase 2 is code-complete and tested. Next action: the owner reviews, then
follows "Deploy plan" below. Nothing has been deployed.**

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
| managedStock transition mode | **DONE** | server + UI, browser-tested in `admin-screens` (switch-on, switch-over per category, switch-off): `stock/[productId]/page.tsx` (SwitchOn/SwitchOff), `stock/switch/page.tsx` |
| Customer stock status | **DONE** | browser-tested in `shop-stock` (cards + modal, 390/1440): `lib/productView.ts`, `components/products/ProductCard.tsx`, `components/products/ProductModal.tsx`, `lib/firebase/products.ts`, `types/product.ts`, `lib/structuredData.ts` |
| Cart and checkout with sizes | **DONE** | browser-tested in `shop-stock` (order saved with size + priceToConfirm): `lib/cart/CartContext.tsx`, `types/cart.ts`, `components/cart/CartDrawer.tsx`, `app/(site)/checkout/page.tsx` |
| Rules for inventory/stockMovements/batches/sales/productPrivate/stockCountDrafts/stockOps; stock fields on products; orders holding stock | **DONE** (tested, not deployed) | `firestore.rules`, `scripts/firestore-rules-roles.test.mjs` |
| Indexes (stock history, today's sales, running-low badge) | **DONE** (not deployed) | `firestore.indexes.json` |
| Stock tab (list, filters, running low, search) | **DONE** | browser-tested in `admin-screens`: `app/(admin)/admin/(protected)/stock/page.tsx`, `lib/admin/stockView.ts`, `lib/admin/collectionStore.ts`, `lib/admin/productsStore.ts` |
| Product history (ledger) + adjust | **DONE** | `stock/[productId]/page.tsx`, browser-tested in `admin-screens` |
| Stock count mode | **DONE** | `stock/count/page.tsx`, browser-tested in `admin-screens` |
| Product editor (server) | **DONE** | `app/api/admin/products/route.ts`, `app/api/admin/products/[productId]/route.ts`, `app/api/admin/categories/route.ts`, `lib/server/productInput.ts`, `lib/server/saveProduct.ts` |
| Product editor (**UI**) | **DONE** (2b) | `components/admin/ProductForm.tsx` (calls the product routes; no browser writes), `components/admin/PriceKeypad.tsx` (till-style RM keypad, also typeable). Category dropdown + "Add new category" (EN + optional ZH), sizes editor (name, uses N base units, channel, price on keypad or **Ask for price**), base unit (locked while managed), low level, expiry, barcodes. Stock tracking is switched on from the product's Stock page (needs a count); the editor links there and shows on-shelf/held/available when managed. Products list: In-stock toggle only on unmanaged products, managed show their status. Tested: `scripts/admin-products.test.mjs` (13) |
| Walk-in quick sale (server, incl. oversold, void, FEFO, wholesale) | **DONE** | `app/api/admin/sales/route.ts`, `app/api/admin/sales/[saleId]/void/route.ts` |
| Walk-in quick sale (**UI**) | **DONE** (2c) | `app/(admin)/admin/(protected)/sale/page.tsx`: search (name/category/barcode), size incl. wholesale, qty, **till price keypad for "Ask for price" sizes** (Add blocked until typed), running total, paid by Cash/DuitNow/Card/Other, Done with one `saleId` per sale (duplicate reply shown as "already recorded"), 409 short list + "Sell anyway", today's sales with Void (reason). Server: `tillPriceSen` per line, used only for unpriced sizes (integer sen, ≥ 1), stored on the sale line with `priceSource: 'till'`; ignored for priced sizes; never written to the product. Tested: `scripts/admin-sale.test.mjs` (13) |
| Stock-tab badge (running low count) | **DONE** (2d) | `components/admin/AdminShell.tsx` + `runningLowStore` in `lib/admin/collectionStore.ts`: one live query `products where managedStock == true and stockStatus in [low, out]` (reads only those docs), bottom tab (phone) and top bar (desktop), aria-label "Stock, N running low". **Needs the new composite index `products (managedStock, stockStatus)`** in `firestore.indexes.json`. Tested in `admin-sale` suite (live 0 → 1 → 2 → 1, desktop) |
| Tests: unit + API end-to-end | **DONE** | `scripts/unit/inventory.test.ts` (23), `scripts/stock.test.mjs` (27) |
| Tests: browser E2E for new screens, screenshots 390/1440 | **DONE** (2e) | `scripts/admin-screens.test.mjs` (35: Stock tab + filters, history, adjust with confirm line, expiry, count mode, switch-on, switch-over per category, switch-off, then all 11 admin screens at 390 and 1440 for sideways overflow + errors + screenshots), `scripts/shop-stock.test.mjs` (16: card status labels, out-of-stock overlay, prices incl. Ask for price, no numbers in the page, modal sizes/status/wholesale note, out disabled, cart + checkout with sizes → order saved with size and priceToConfirm). Screenshots go to `.screenshots/phase2/` (gitignored). |
| Customer-site pixel diff vs production | **NOT DONE** | Would need production screenshots (live-domain requests); skipped to stay inside the request budget. The shop suite covers the Phase 2 changes functionally. |
| Lighthouse / bundle sizes | **DONE** (2f) | see "Performance" below; `scripts/admin-lighthouse.mjs` |

---

## How to run the tests

```bash
npm test                    # everything below, in order
npm run test:rules          # rules (16) + role matrix (230), Firestore emulator
npm run test:guest-checkout # 3
npm run test:unit           # scripts/unit/*.test.ts (inventory 23, normalizeOrder 26)
npm run test:e2e            # builds .next-test against the emulators, then all suites:
                            #   order-abuse 17, admin 29, admin-auth 10, admin-users 18,
                            #   stock 27, admin-orders 8, admin-products 13, admin-sale 17,
                            #   admin-screens 35   (the last four: WebKit browser suites)
npm run test:shop           # customer side, WebKit 390/1440 (16); seeds BEFORE its own
                            #   build because /products is ISR
bash scripts/test-env.sh bash scripts/e2e-suites.sh stock                # one suite
SKIP_BUILD=1 bash scripts/test-env.sh bash scripts/e2e-suites.sh stock   # reuse last test build
VERBOSE=1 ...               # full Playwright call log on a FAIL
```

Everything runs against the Firebase emulators (project `demo-sbh-test`) and a
local build in `.next-test/`; nothing touches production. Ports 8080, 9099,
9199 and 3100 must be free (test-env.sh waits up to 20 s for a previous run to
release them). Screenshots and Lighthouse reports: `.screenshots/phase2/`.

Last full run: 2026-10-08, `npm test` all green: 488 checks
(rules 246, guest 3, unit 49, e2e 174, shop 16; order-abuse/admin/stock suites
include the hotfix tests).

---

## Performance (2f, local production build, emulator)

First-load JS per admin route (gzip, from `next build`); flag is 250 kB:

| Route | Phase 2 | main |
|---|---|---|
| /admin (orders) | 238 kB | 238 kB |
| /admin/orders/[id] | 231 kB | 230 kB |
| /admin/products | 236 kB | 236 kB |
| /admin/products/new, /[id] | 238 kB | 237 / 238 kB |
| /admin/stock | 237 kB | (stub) |
| /admin/stock/[id] | 239 kB | new |
| /admin/stock/count, /switch | 237 kB | new |
| /admin/sale | 239 kB | new |

Nothing over 250 kB; no regression on existing routes. The product editor is
lazy-loaded (its chunk is 5.5 kB gzip). Most of the 238 kB is Firebase
(auth + firestore), shared by every admin page.

Lighthouse 12 (mobile, simulated slow 4G, signed in; re-run after the final
build on 2026-10-08). Warm cache after the first page: performance 99–100,
accessibility 100, best practices 93 on /admin, /admin/stock, /admin/stock/[id],
/admin/products, /admin/products/new, /admin/sale. Cold first load of /admin
varies run to run: performance 75–95, LCP 2.3–4.8 s, 340 kB JS (Firebase SDK on
a throttled phone; same code path as today), CLS up to 0.11 on that first paint
(skeleton → list). Best practices 93: report-only CSP warnings about the Auth
emulator (test only) and the existing `upgrade-insecure-requests` warning. The
11 px text Lighthouse flagged on the stock page is now 12 px (font-size audit
passes). Run: `LIGHTHOUSE_BIN=… bash scripts/test-env.sh node
scripts/admin-lighthouse.mjs` (Lighthouse is not a project dependency).

## "Ask for price" (no price) rules — apply everywhere

- A sell unit with `priceSen: null` is "Ask for price". A product whose public
  units are all unpriced has **no `price` field** (the shop shows "Ask for price").
- Online orders: accepted, line kept with `unitPriceSnapshot: null`, left out of
  the estimate, order flagged `priceToConfirm` (hotfix `d652d23`, kept in Phase 2).
  The admin must type the full final total before Accept (not prefilled).
- Managed stock applies exactly as for priced products: availability check at
  order time, hold on confirm, deduct on collect, release on cancel (tested in
  `admin-products` suite).
- Quick sale: the seller must type the price at the till (keypad) before the
  line can be added; the server refuses an unpriced line without `tillPriceSen`.
  Stored on that sale line only (`unitPriceSen`, `priceSource: 'till'`); the
  product stays "Ask for price". Managed stock still comes off as usual.
- **Phase 2B promotions must exclude "Ask for price" lines/products**: a
  percentage or fixed discount has nothing to apply to, and a "spend RM X"
  threshold must not count them. Check `unitPriceSen === null` (orders) /
  `priceSen === null` (sell units) / `priceSource === 'till'` (sale lines).

## Known limits (accepted, not blocking)

1. **`/products` is cached for 5 minutes (ISR).** A product that just ran out
   can still look available for up to 5 minutes; the server refuses the order
   with a clear message (no numbers). Cosmetic.
2. **`orders` rule still allows admin browser status updates for orders that
   hold no stock.** Deliberate, so the code live today keeps working between
   the rules deploy and the code deploy. No Phase 2 screen uses it. Optional
   hardening after Phase 2 code is live: deploy-plan step 5.
3. **Customer-site pixel diff vs production not done** (it needs production
   screenshots, i.e. live-domain requests). The shop browser suite checks the
   Phase 2 changes; unmanaged products render exactly as before.
4. **Cold first load of the admin on a slow phone is 2.3–4.8 s LCP** (Firebase
   SDK, same as today; Phase 2 adds < 1 kB to existing routes).

Fixed during step 2 (for the record): order page wrote status from the browser
(2a); old product form ignored sizes (2b); `/admin/sale` 404 (2c); "Ask for
price" products could not be toggled In stock because the rules demanded a
numeric price — **also live today, fixed by the Phase 2 rules** (2b); managed
products could have their base unit changed, which would silently rescale
stock (server now refuses, 2b); saved opening counts not prefilled when the
Stock page or a Switch-over category was opened directly (2e); small text and
a few layout nits (2e/2f).

---

## Deploy plan (owner runs this; nothing is deployed yet)

Firebase project `sim-baking-house`, Vercel project `simbakinghouse-web`
(production deploys on push to `main`). Production is `ac3fcdb`
(deployment `dpl_8q11qBnvTEq18bZPoKVPgGZsm4PF`). No new environment variables.

**0. Prepare (no effect on production)**
```bash
git checkout phase2-inventory && npm test        # must be all green
git checkout main && git pull                    # main must still be ac3fcdb (or merge it in first)
git merge --no-ff phase2-inventory -m "Phase 2: inventory"   # do NOT push yet
firebase login && firebase use sim-baking-house
```
Pick a quiet time (no orders being processed). Each step below is safe for the
code that is live at that moment.

**1. Indexes, then wait for them to build**
```bash
firebase deploy --only firestore:indexes
```
- If asked whether to delete indexes that are not in the file, answer **No**.
- Firebase console → Firestore → Indexes: wait until all three new ones show
  **Enabled** (not "Building"): `stockMovements (productId ↑, at ↓)`,
  `sales (dayKey ↑, atMs ↓)`, `products (managedStock ↑, stockStatus ↑)`.
  Usually a few minutes with this much data. Do not go on while any is building
  (product history, today's sales and the Stock badge would fail).
- Effect on the live site: none (unused until Phase 2 code ships).
- **Rollback:** not needed. To remove anyway: console → Indexes → delete the three.

**2. Rules**
```bash
firebase deploy --only firestore:rules
```
- Safe for today's code: it never writes `managedStock`/`stockStatus`, no
  order holds stock yet, and the product price rule only got looser (fixes the
  In-stock toggle on "Ask for price" products today).
- Check right after, on the **current** admin: accept a test order, toggle In
  stock on a product, save a product in the old form. All must still work.
- **Rollback** (only while Phase 2 code is NOT live): console → Firestore →
  Rules → history → restore the previous version, or
  `git checkout ac3fcdb -- firestore.rules && firebase deploy --only firestore:rules && git checkout HEAD -- firestore.rules`.
  Do not roll the rules back while Phase 2 code is live: the Stock screens read
  `inventory`/`stockMovements`/`sales`/`productPrivate`/`stockCountDrafts`, which
  the old rules deny.

**3. Code**
```bash
git push origin main
```
- Vercel → wait for the production deployment of the merge commit to be
  **Ready** and to carry the production domains.
- Smoke check (≤ 3 requests): homepage 200; `/admin` signs in; Stock tab shows
  "0 of N products managed here" (nothing is managed until Sim switches it on,
  so the shop behaves exactly as before).
- **Rollback:** Vercel → Deployments → `dpl_8q11qBnvTEq18bZPoKVPgGZsm4PF`
  (`ac3fcdb`) → **Instant Rollback** (Vercel then stops auto-promoting new
  pushes until you promote one). Then `git revert -m 1 <merge sha>` on `main` and
  push so `main` matches production again. Data written by Phase 2 stays
  readable by the old code (products keep `price` and `inStock`; sizes are extra
  fields), with these caveats:
  - Orders confirmed under Phase 2 that **hold stock** (`stock.state: reserved`)
    cannot change status from the old admin while the Phase 2 rules are live.
    Before rolling back, finish or cancel them in Phase 2; or also roll back the
    rules (step 2 rollback) — the holds are then simply forgotten.
  - Managed products: the old shop ignores `stockStatus`, so a managed product
    that is "out" shows as available if its `inStock` is on. Turn `inStock` off
    for those by hand if needed.
  - Walk-in sales recorded in Phase 2 stay in `sales` (old code ignores them).

**4. Hand test** (checklist below) on a real phone, same day.

**5. Optional hardening, a few days later** (once nothing old is in use): set the
`orders` rule to `allow update: if false;` (all status changes go through the
API), run `npm run test:rules`, deploy rules. Rollback = redeploy the previous
rules.

---

## Hand-test checklist (real phone, production, after step 3)

Use one cheap test product first, e.g. a spare item Sim can count easily.

**Stock tab**
- [ ] Stock tab opens; shows "0 of N products managed here"; no badge on the tab.
- [ ] Open the test product → "Not managed here yet" → type the shelf count →
      tick "I'll stop updating it in the old system" → Switch on. Numbers appear:
      On hand = your count, Held 0, Available = count.
- [ ] Change stock → Restock 2 → Review shows "X → X+2" → Confirm. History shows
      "Restock +2" with your email.
- [ ] Count stock → type a different number for the test product → Review → Apply.
      History shows "Count".
- [ ] Set the product's "Running low at" (editor) above its stock → the Stock tab
      badge shows 1 and the product is in "Running low". Shop card says "Low stock"
      (may take up to 5 minutes, ISR).
- [ ] Filters: Low / Out / Not managed show the right products; search by name works.
- [ ] Products tab → the test product shows its status instead of the In-stock button.

**Quick sale**
- [ ] Stock tab → Quick sale → search the test product → pick size → qty 1 → Add
      → Cash → Done. "Sale recorded: RM …"; it appears under Today's sales; stock
      went down by 1 size.
- [ ] Sell more than is left → red list "selling N, only M available" → Sell
      anyway → recorded; product shows Out; badge counts it.
- [ ] Void that sale with a reason → stock comes back; the sale stays, marked voided.
- [ ] An "Ask for price" product: "Add to sale" stays disabled until you type the
      price on the keypad; after Done, the product is still "Ask for price".

**Customer order for a managed product**
- [ ] Restock the test product so it is In stock.
- [ ] On the shop (phone, logged out): open the product → status "In stock",
      sizes if any, no numbers anywhere → add to cart → checkout → send.
- [ ] Try to order more than is in stock → clear "We don't have enough …"
      message with no numbers.
- [ ] Admin → the order → line shows the size → type the total → Accept →
      "Stock is held for this order"; Stock page shows it under Held.
- [ ] Mark paid → ready → collected → "Stock was taken off"; On hand went down.
- [ ] Place another order, Accept it, then Cancel with a reason → "Held stock was
      released".
- [ ] An order mixing a priced item and an "Ask for price" item → order page shows
      "price to confirm"; the total box is empty until you type it.

If anything in this list fails: stop, note the step, and use the rollback for
step 3 (code) — rules and indexes can stay.
