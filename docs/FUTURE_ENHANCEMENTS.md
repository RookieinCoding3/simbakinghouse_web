# Future enhancements

Not built yet — each item below is a deliberate scope cut from the 2026-10-04
PWA/SEO pass, not an oversight. Why it matters and roughly how to do it.

## Google Search Console

**Why:** Without this, nobody (including us) can see how Google actually
crawls and indexes the site, what search queries bring people here, or
whether the sitemap is even being read. It's also the fastest way to get a
changed favicon to show up in search results — Google caches favicons
separately from page content and can take weeks to refresh on its own.

**How:**
1. Verify domain ownership — easiest is a DNS TXT record at the registrar
   (no code change), or use the `metadata.verification.google` slot already
   left in `app/layout.tsx` (commented out) once a real token exists.
2. Submit `https://www.simbakinghouse.com.my/sitemap.xml` under Sitemaps.
3. Use URL Inspection → Request Indexing on `/` — this is also what
   refreshes the favicon Google shows in search results, separately from
   the page content itself.

## Google Business Profile

**Why:** This is what actually shows up in Google Maps and the local
3-pack search results (far more visible for a neighborhood bakery than
organic search alone), and it's the primary thing local customers check for
hours/photos before visiting.

**How:** Claim/create the listing, set hours to 6:30 AM–1:00 PM daily, add
real photos, link the website. Keep the name, address, and phone number
**character-for-character identical** to the JSON-LD in `app/layout.tsx` —
a mismatch between Google Business Profile and on-site structured data
(a classic "NAP inconsistency") actively hurts local search ranking.

## Indexable product pages (`/products/[slug]`)

**Why:** Right now every product only exists inside a client-side modal on
`/products` (see `components/products/ProductModal.tsx`) — there's no URL
a search engine (or a customer) can link to or index for a single product.
`lib/structuredData.ts` already emits `Product` schema for the full list,
but without a real per-product URL that schema has nothing to attach to in
search results (no individual rich result, no shareable link).

**How:** Add `app/products/[slug]/page.tsx`, generate static params from the
product list, reuse the existing modal's content as the page body, emit a
single `Product` JSON-LD node (not the list version) with `offers.url`
pointing at the new page, add each slug to `app/sitemap.ts`. Decide whether
the modal becomes a client-side enhancement *on top of* the real page
(parallel routes / intercepting routes) or whether /products keeps linking
out to full page loads — the former is nicer UX but more work.

## Bahasa Malaysia version of key pages

**Why:** `/privacy` and `/terms` already ship an EN/BM toggle
(`components/legal/LegalPage.tsx`). Extending that to `/`, `/products`,
`/about`, `/location` would reach Penang's BM-speaking customers directly
and is a real local-SEO signal via `hreflang`.

**How:** Either mirror the same client-side toggle pattern, or (better for
SEO, since toggled content isn't separately crawlable) real `/ms` routes
with `hreflang="ms-MY"`/`hreflang="en-MY"` alternates via Next's
`alternates.languages` metadata field, linked from each other and from a
language switcher in the header. The BM text on `/privacy` and `/terms`
is machine-translated and explicitly flagged for lawyer review
(`components/legal/LegalPage.tsx`'s comment) — any new BM page content
should get the same native-speaker review before publishing, not just a
translation pass.

## Check WhatsApp/Instagram/Facebook link previews

**Why:** `og-image.jpg` and the per-page Open Graph tags were just added/
fixed in this pass but have never been checked against how these three
specific apps actually render a shared link — each has its own cache and
occasionally its own quirks (stale cached previews in particular; WhatsApp
in particular can cache an old preview for a link for a long time even
after the og:image changes).

**How:** Share the production URL in a WhatsApp chat, an Instagram DM/story
link sticker, and a Facebook post (draft, don't need to publish) and look
at what actually renders — title, description, image crop. If a stale
preview shows up, each platform has its own cache-debugger/scraper tool
(e.g. Facebook's Sharing Debugger) to force a re-fetch.

## CAPTCHA on checkout (not added yet, 2026-10-04 order-abuse pass)

**Why not yet:** The honeypot, signed-timing check, and Firestore-backed
per-phone/per-IP/global rate limiting added in this pass (see
`lib/botDefense.ts`, `lib/checkoutToken.ts`, `lib/orderRateLimit.ts`)
already block the kind of simple scripted abuse a small bakery site
actually attracts. A CAPTCHA adds friction to every real customer's
checkout for a threat level that doesn't exist yet — add it when there's
evidence of abuse these measures don't catch (e.g. rate-limit logs showing
many distinct phones/IPs placing implausible orders in a coordinated way),
not pre-emptively.

**Option A — Cloudflare Turnstile**

- What it is: a free, privacy-friendlier CAPTCHA alternative — usually
  invisible, only shows a visible challenge for suspicious traffic.
- Manual steps the owner (not Claude) would need to do: create a free
  Cloudflare account, add a Turnstile "site", choose the domain
  (simbakinghouse.com.my), copy the site key and secret key.
- Code side (for whoever implements it later): add the Turnstile script +
  widget to `app/checkout/page.tsx`, send its response token with the order
  POST, verify it server-side in `app/api/orders/route.ts` via Cloudflare's
  `siteverify` endpoint before accepting the order. Needs one new env var
  (`TURNSTILE_SECRET_KEY`) set in Vercel.
- Trade-off: one more third-party script loaded on checkout (CSP's
  `script-src`/`connect-src`/`frame-src` would need Cloudflare's domains
  added), but no Google account/project dependency and generally the least
  visible-to-the-customer option.

**Option B — Firebase App Check (reCAPTCHA v3 provider)**

- What it is: the mechanism already wired into the codebase but currently
  inert — see `lib/firebase/appCheck.ts`: `initAppCheck()` is a no-op
  until `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set, by design.
- Manual steps the owner would need to do: in the Firebase Console, App
  Check → register the web app → reCAPTCHA v3 provider → create/attach a
  reCAPTCHA v3 site key (via Google Cloud's reCAPTCHA Enterprise or
  classic reCAPTCHA admin console) → copy the site key into Vercel as
  `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` → in Firebase Console, App Check →
  enforce for Firestore (and Storage, if the DuitNow QR upload should be
  covered too).
- Code side: already done — once the site key env var exists in
  production, `initAppCheck()` and `getAppCheckToken()` activate with zero
  further code changes, and `app/api/orders` already accepts the
  `X-Firebase-AppCheck` header the checkout page sends today.
- Trade-off: ties the anti-abuse mechanism to a Google product already in
  use elsewhere (Firebase Auth/Firestore), so one fewer vendor relationship
  to manage, but reCAPTCHA v3 runs an invisible background script on every
  page (slight privacy/perf cost) and enforcing App Check on Firestore is
  an all-or-nothing switch — worth testing on a quiet day, not a busy one.

**Recommendation when the time comes:** B, since it's already half-built
and needs no new vendor — it's a Firebase Console configuration step away,
not a code project.
