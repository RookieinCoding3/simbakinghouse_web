# Sim Baking House — Website Task Spec

Tell Claude Code:
`Read TASK.md and start with Phase 0. Ask me before moving to the next phase.`

---

## Context

Sim Baking House is a baking supply shop in Bayan Lepas, Penang. Open daily 6:30 AM – 1:00 PM.
It sells baking ingredients, premixes, tools and decorations. Not finished baked goods.

- Live site: https://www.simbakinghouse.com.my
- Stack: Next.js (App Router), Firebase (Firestore + Storage)
- Pages: Home, About, Products, Location
- WhatsApp Business number: `60128664836`
- Email: `simbakinghouse25@gmail.com`
- The shop owner is one person. She is not technical. Every admin action must be
  doable on a phone in under 10 seconds.

## Rules for this work

1. **Do not redesign the site.** The visual style is intentional and stays. You are
   fixing bugs, clarifying words, and adding an order flow.
2. **Explore before you edit.** Do not assume file paths or component names.
   Read the repo structure first and tell me what you found.
3. **No new dependencies** unless you explain why and I approve.
4. **One phase at a time.** Stop at the end of each phase and wait for me.
5. Do not invent product data, prices, or copy that states facts I have not given you.

---

## Phase 0 — Broken things (do first)

These cost real orders today.

### 0.1 Wrong WhatsApp number on Products page
The Products page footer links to `wa.me/60123456789` and `tel:+60123456789`.
These are placeholders. The real number is `60128664836`.

- Grep the whole repo for `60123456789` and replace every instance.
- There is no phone line for the shop. Remove the `tel:` link entirely rather than
  pointing it at the WhatsApp number. Keep only the WhatsApp link.

### 0.2 Wrong canonical URL
The Products page sets `canonical: https://simbakinghouse.com` and its OG URLs point
to the same wrong domain. The real domain is `https://www.simbakinghouse.com.my`.

- Fix the canonical and all OG/Twitter URLs on that page.
- Grep for `simbakinghouse.com` without `.my` across the repo and fix all of them.
- Move the base URL into a single constant (e.g. `lib/site.ts`) and derive metadata
  from it, so this cannot drift again.

### 0.3 Opening hours are inconsistent
Homepage says `6:30 AM - 12:30 PM`. Products page footer says `6:30 AM - 1:00 PM`.

- **Correct value: 6:30 AM – 1:00 PM.**
- Put hours in one place (a Firestore `settings/shop` doc, or a constant in
  `lib/site.ts` if Firestore is overkill). Every page reads from that one source.
- Grep for `12:30` and remove every hardcoded instance.

### 0.4 Dead email link
The homepage footer "Email us" has `href="#"`.

- Point it at `mailto:simbakinghouse25@gmail.com`.

### Acceptance
- `grep -r "60123456789\|12:30\|href=\"#\"" .` returns nothing in page/component code.
- Only one place in the repo defines the base URL, phone number, and hours.

---

## Phase 1 — Copy rewrite

The design stays. Only the words change. Goal: every line adds new information.
No hype. Plain, useful language.

### Homepage

| Current | Change to |
|---|---|
| Hero: "A space for baking, in the heart of Penang." | "Baking supplies in Bayan Lepas. Open 6:30am daily." |
| Section: "Essentials for all" | "Best sellers" |
| Section: "Why Sim Baking House" / subtitle "A small shop with a simple promise." | Keep the heading. **Delete the subtitle.** |
| Card 01 "Premium quality" — "Only premium baking ingredients and supplies, carefully selected to ensure consistent results for your home baking projects." | "Stocked from the same suppliers Penang bakeries use." |
| Card 04 "Fresh stock" — "We track expiry dates carefully, so you always get the freshest ingredients for perfect results." | "Expiry date on every label. We pull stock before it turns." |
| Card 06 "Fair prices" — "Quality baking supplies at honest prices. Great ingredients should be affordable for home bakers." | "Retail prices online. Bulk rates for regular bakers, just ask." |
| Card 03 "Complete range" — "From basic flour to specialty premixes, baking tools to decorations — everything you need under one roof." | "Flour, premix, tools, decorations. One stop, no second shop." |
| Cards 02 "Expert guidance" + 05 "Personal service" | **Merge into one card.** Title: "Ask Sim". Body: "Tell her what you're baking and she'll pick the right premix." The grid becomes 5 cards. |
| Section: "We're here to help" | "Not sure what to buy?" |

Also on the homepage:
- The phrase "in the heart of Penang" currently appears in the hero and again in the
  About block. Remove it from the About block.
- Expiry-date tracking is claimed in the "Real ingredients, no shortcuts" paragraph
  and again in card 04. Remove it from the paragraph, keep the card.
- The bottom has three CTAs stacked: "Order online →", "Place an order", "Order now".
  **Delete all three.** Replace with one line of text plus one button:
  - Text: "Order online, collect next morning."
  - Button: "Start an order" → links to `/products`

### Products page

| Current | Change to |
|---|---|
| "THE COLLECTION" | "Products" |
| "✨ FILTER BY CATEGORY" + "Filter" + "Collections" (three labels, one control) | One label: "Categories" |
| "0 Curated Essentials" | "{n} products" |
| "Guided Paths" | "Shop by level" |
| "🌱 BEGINNER" | Keep |
| "✨ SECRET" | Rename. It tells the customer nothing. Use a real description of what is in it. **Ask me what belongs in this group before renaming.** |
| "🍞 ARTISAN" | Keep |
| "VIEW COLLECTION" | "View" |

### Acceptance
- No heading is restated by the text directly under it.
- No claim appears twice on the same page.
- Exactly one primary CTA on the homepage.

---

## Phase 2 — Products page must show prices and stock

Currently the Products page fetches from Firebase on the client, so crawlers and
first-paint users see "Loading…" and zero products.

### 2.1 Server-render the product list
- Move the product fetch to a server component / `generateStaticParams` with ISR
  (revalidate ~300s), so the HTML contains products.
- Keep client-side filtering for category and search on top of server-rendered data.

### 2.2 Show price on every product card
- Format as `RM 12.50`.
- If a product has no price set, show "Ask for price" instead of hiding the card.

### 2.3 Show stock state
- Each product has a boolean `inStock`.
- `true` → normal card, "Add to cart" enabled.
- `false` → card is dimmed, badge "Out of stock", add button disabled.
- Do **not** show stock counts to customers. Only the boolean.

### 2.4 Product schema markup
Add JSON-LD `Product` schema per item (name, image, price, priceCurrency `MYR`,
availability) so Google can show prices in results.

---

## Phase 3 — Order flow

### 3.1 Cart
- Persist cart in `localStorage` so it survives refresh.
- A cart button is visible on **every** page, showing item count.
- Cart drawer: line items, quantity steppers, remove, subtotal, "Continue to order".

### 3.2 Checkout form
Fields:
- Name (required)
- Phone (required, Malaysian format, normalise to `60XXXXXXXXX`)
- Fulfilment: radio — `Self pickup` (default) or `Delivery — we'll quote you the fee`
- Preferred collection date (required if pickup; only allow dates the shop is open)
- Preferred collection time (within 6:30 AM – 1:00 PM)
- Notes (optional)
- Consent checkbox: "I agree to Sim Baking House storing my name and phone number to
  process this order." Links to `/privacy`.

Above the submit button, show this line:
> We'll confirm stock and send a payment QR on WhatsApp. No payment needed yet.

Button label: "Send order on WhatsApp".

### 3.3 On submit
1. Write an order document to Firestore with status `new`.
2. Generate a short human-readable order ID: `SBH-0001`, incrementing.
   Use a Firestore transaction on a counter doc. Do not use random strings — the
   owner reads these out loud.
3. Redirect the customer to `/order/{orderId}` **and** open a `wa.me` link in a new tab
   with a pre-filled message.

### 3.4 Pre-filled WhatsApp message

```
Hi Sim Baking House, I'd like to order.

Order: SBH-0001
Name: {name}
Collect: {date} {time}

{qty} x {product name}
{qty} x {product name}

Estimated total: RM {total}

Link: https://www.simbakinghouse.com.my/order/SBH-0001
```

- URL-encode it properly.
- `wa.me` links break on very long text. If the cart has more than 8 line items,
  replace the item list with "See order link below" and keep the link.

### 3.5 Order status page `/order/{orderId}`
Public but unguessable is not good enough — see Phase 5.2. Access rule:
the page requires the order ID **and** the last 4 digits of the phone number entered
by the customer, stored in `sessionStorage` after checkout so they don't re-enter it
in the same session.

The page shows, depending on status:

| Status | What the customer sees |
|---|---|
| `new` | "Order received. Sim is checking stock." |
| `confirmed` | Final total, **DuitNow QR**, "Pay and send the receipt on WhatsApp." |
| `paid` | "Payment received. We're packing your order." |
| `ready` | "Ready for collection." + collection time + pickup QR code |
| `collected` | "Collected. Thank you!" |
| `cancelled` | Reason, plus a WhatsApp link to ask |

The DuitNow QR image lives in Firebase Storage. It must **not** be publicly listed or
linked anywhere else on the site.

### 3.6 Data model

```
orders/{orderId}
  orderId: "SBH-0001"
  status: "new" | "confirmed" | "paid" | "ready" | "collected" | "cancelled"
  customerName: string
  customerPhone: string        // 60XXXXXXXXX
  phoneLast4: string           // for the access check
  fulfilment: "pickup" | "delivery"
  collectDate: timestamp
  collectTime: string
  notes: string
  items: [{ productId, name, qty, unitPriceSnapshot }]
  estimatedTotal: number       // computed client-side, NEVER trusted
  confirmedTotal: number|null  // set by owner in admin, this is the real one
  createdAt: timestamp
  updatedAt: timestamp
  statusHistory: [{ status, at }]
```

---

## Phase 4 — Admin

Reuse the existing admin dashboard if one exists in this repo. Explore first and tell
me what is already there before building anything new.

### 4.1 Order queue
Default view: orders with status `new`, oldest first. Each row shows order ID,
customer name, item count, estimated total, requested collection time.

Tap an order to open it. Actions:

- **Accept** → set status `confirmed`. Requires the owner to enter/confirm the final
  total first (pre-filled with `estimatedTotal`, editable). On save, show a
  **"Send on WhatsApp"** button that opens `wa.me/{customerPhone}` with this pre-filled:

  ```
  Hi {name}, your order {orderId} is confirmed.
  Total: RM {confirmedTotal}
  Pay here: https://www.simbakinghouse.com.my/order/{orderId}
  Collect: {date} {time}
  ```

  One tap to send. We are **not** using the WhatsApp Cloud API. Nothing auto-sends.

- **Mark paid** → status `paid`
- **Mark ready** → status `ready`
- **Mark collected** → status `collected`. On this transition, if the product has
  `stockCount` set, decrement it by the ordered qty.
- **Cancel** → status `cancelled`, with a reason field

### 4.2 Product management
- Add / edit product: name, photo, price, category, description
- **In stock / Out of stock toggle.** This is the main control. It must be one tap
  from the product list, no drilling in.
- Optional `stockCount` number field. If left empty, stock tracking is simply off for
  that product. Never block a sale on `stockCount`.

### 4.3 Settings
Opening hours, WhatsApp number, DuitNow QR upload. Everything Phase 0 centralised
should be editable here.

---

## Phase 5 — Security

### 5.1 Firestore rules
Audit the current rules first and show them to me before changing anything.
Target state:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /products/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /settings/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /orders/{id} {
      allow create: if isValidNewOrder();
      allow read, update, delete: if isAdmin();
    }

    match /counters/{id} {
      allow read, write: if false;   // transactions only, via server
    }

    match /{document=**} {
      allow read, write: if false;
    }

    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }

    function isValidNewOrder() {
      let d = request.resource.data;
      return d.status == 'new'
        && d.confirmedTotal == null
        && d.items.size() > 0
        && d.items.size() <= 50
        && d.customerName is string && d.customerName.size() <= 100
        && d.customerPhone is string && d.customerPhone.matches('^60[0-9]{8,10}$');
    }
  }
}
```

Key points:
- Admin is a **custom claim** (`admin: true`), not a field in a user document.
- Customers cannot read orders directly. The `/order/{id}` page reads through a
  server route that checks order ID + phone last 4.
- Default deny at the bottom.

### 5.2 Never trust the client total
`estimatedTotal` from the browser is display only. The real charge is
`confirmedTotal`, set by the owner in admin. Make this explicit in code comments so a
future change does not accidentally treat the client value as authoritative.

### 5.3 Firebase App Check
Enable App Check with reCAPTCHA v3 for web. Enforce on Firestore and Storage. This is
the main defence against scripted spam orders.

### 5.4 Storage rules
- Product images: public read, admin write.
- DuitNow QR: read only through the order status server route. Not publicly listed.
- Do **not** build receipt upload. Payment receipts stay in WhatsApp. We never store
  bank screenshots.

### 5.5 Privacy (Malaysia PDPA)
Create `/privacy`, linked from the footer and the checkout consent box. Cover:
- What we collect: name, phone, order details
- Why: to process and prepare the order
- How long: orders deleted after 12 months
- Contact: simbakinghouse25@gmail.com

Add a scheduled Cloud Function (or a documented manual step) that deletes orders
older than 12 months.

### 5.6 Basics
- Confirm no secrets in the client bundle beyond the public Firebase config
- Confirm `.env*` and any service account JSON are gitignored and were never committed
- Scheduled Firestore export to a Storage bucket

---

## What NOT to build

Do not build these. If you think one is needed, ask me first.

- WhatsApp Cloud API integration or any auto-sending chatbot
- Online card payment / Stripe / payment gateway
- Customer accounts or login
- Delivery fee calculation or courier integration
- Receipt image upload
- Stock counts shown to customers

---

## Order of work

Phase 0 → 1 → 2 → 3 → 4 → 5.

Stop after each phase. Give me a short summary of what changed and what you want me
to check, then wait.
