# For Sim to confirm (storefront)

Nothing below is shown as a fact on the shop until Sim confirms it.

| # | Item | Where | Status now |
|---|---|---|---|
| 1 | **Languages spoken in the shop**: "We speak English, Bahasa Melayu and 中文" | Admin → Settings → "Show We speak…" | **Off** by default. Switch on only if true. |
| 2 | **Chilled items**: what to tell customers (fridge in the shop? collect the same day? cool bag?) | Admin → Settings → Chilled notice (English / Chinese) | A neutral default that says nothing about the shop's own fridges: "needs to stay cold; collect soon after Sim confirms; bring a cool bag if travelling far". Edit to the real practice. |
| 3 | Which products are **chilled** | Product editor → "Chilled" | None ticked. |
| 4 | Which products go in each **collection** (first-timers, bundles, regulars) | Product editor → Collections | None ticked: the collections stay hidden until Sim ticks products. "New to baking? Start here" goes to Ask Sim until the first-timers collection has products. |
| 5 | Order flow wording: "Sim checks the shelf, confirms your order and sends a DuitNow QR"; "book your own Grab or Lalamove; we don't deliver" | Home → How to order | From the owner's brief (2026-10-17). Confirm the wording. |
| 6 | Chinese wording of the new storefront text (lib/i18n/strings.ts) | Home, products, cart | Written by Claude in simplified Chinese; please read through once. |
| 7 | Older home-page copy not changed in this branch ("Real ingredients, no shortcuts… small-batch stock", "Crafting joy since 2017", "Order online, collect next morning") | Home sections below the new ones | Kept as it was; check it is still true. |
| 8 | **Returns note in every product popup** now restates the Terms of Sale (no change-of-mind returns; damaged, expired or wrong items replaced or refunded if reported within 24 h with a photo) instead of "all sales are final and non-refundable" | Product popup | Matches app/(site)/terms. Confirm. |
| 9 | **"You will also need…"** per product (e.g. eggs, butter, tin for a premix) | Product editor → "You will also need" (EN / ZH) | Empty: Sim fills it for first-timer products. Not invented. The customer review asked for amounts, tin size, oven temperature. |
| 10 | "Baking bundles" are separate products, not one-price bundles; the reviewer found the name confusing | Collections | Name kept as specified. Rename (e.g. "Goes well together") or add real bundle products. |
| 11 | About page says the shop stocks "the same starter culture" Sim uses | About page | Not in the demo list; check it is (or will be) sold. |
| 12 | Best sellers use three fixed product ids in code | Home → Best sellers | The section now hides itself if those products are gone. |
| 13 | Earliest collection is tomorrow (checkout rule) — How to order now says "from the next day" | How to order, checkout | Confirm same-day collection is really not offered. |
