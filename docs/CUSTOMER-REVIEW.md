# Customer review — first-time visitor (phone)

> Written by an isolated review agent (browser only, no repository access) on
> 2026-10-17, against a local production build with a demo catalogue (the
> staging URL is not available yet; see sbh-inventory docs/BLOCKERS.md #12).
> The developer filled in the "Fixed?" column afterwards; see
> "Fixes after the review" at the end.

## Who I am
I'm 28 and I've never baked anything. I found "Sim Baking House" on Google Maps on my phone (iPhone, Safari, 375px wide) and tapped through to the website. I want to bake one simple cake this weekend. I read English and simplified Chinese. All I know about the shop is what the website shows me.

*(Test setup: Playwright WebKit with iPhone viewport and user agent against http://localhost:3100. Every non-localhost request was blocked, so no WhatsApp message was sent, and the Google Maps embed and any external images could not load.)*

## What I understood in 5 seconds
First screen only, before scrolling:
- Red kicker line "BAKING SUPPLY SHOP · BAYAN LEPAS, PENANG" and a big serif headline "Your baking supply shop". **It's a shop that sells baking ingredients, in Penang.** Clear.
- The subtitle says "zero-intimidation advice for home bakers", which is reassuring for someone like me.
- Two buttons: "BROWSE BAKING INGREDIENTS" and "NEW TO BAKING? START HERE". The second one is exactly me, and I'd tap it.
- "Open Daily: 6:30 AM - 1:00 PM", so this is a physical shop with early hours.
- At the bottom of the screen there's a drawing of boxes labelled Flour 面粉 / Premix 预拌粉 / Butter 牛油 / Sugar 糖 / Tools 工具 with "Photo coming soon: flours, premixes and tools on our shelves". It looks a bit unfinished, but it's friendly.

I could **not** tell from the first screen whether I can order online, whether they deliver, or what anything costs. The page looks clean and calm, but there are no real photos and no prices.

## My journey (step by step, what I did and felt)
1. **Scrolled the home page.** Right after the hero there's a "HOW TO ORDER" box in three steps: "Pick items online… Nothing to pay yet", "Confirm and pay on WhatsApp… sends you a DuitNow QR", "Collect at the shop… or book your own Grab or Lalamove courier to collect. We don't deliver." This is the most useful part of the site. I understood the whole model in about 15 seconds. "We don't deliver" is a little disappointing, but it's honest.
2. **"Baking for the first time?" section.** "Easy, forgiving products to start with": All-purpose flour 1kg, Butter cake premix 500g, Chocolate cake premix 500g, Round cake tin 8 inch. This is exactly what I need, but **none of the cards shows a price**, every image is a tan blob that says "Product Image", and tapping a product takes me to a filtered list instead of that product.
3. Next were "Baking bundles" and "For regulars and home businesses", both also without prices. "Baking bundles" turned out to be loose products (Butter cake premix, Cake flour, Caster sugar, Cocoa powder), not one bundle I can buy. I was confused about what a "bundle" means here.
4. **"BEST SELLERS" said "No products available at the moment. Check back soon!"** I worried that the shop might be empty or closed. It's the opposite of what the sections above just showed me.
5. The rest of the home page (Family founded, Why Sim Baking House, Not sure what to buy?, footer) is all in English, and some of it repeats itself. The footer says "Order online, collect next morning", but HOW TO ORDER says "during opening hours". Which one is true?
6. **Tapped "NEW TO BAKING? START HERE"** and got Products with a "Baking for the first time? ✕" chip and 4 products, now **with prices** (RM 4.50, RM 12.90, RM 13.90, RM 25.00). Good. But on the phone the names are cut off ("All-purpose flo…", "Butter cake…"), prices wrap onto two lines ("RM / 4.50"), and a black floating "CATEGORIES" button sits on top of the second row of cards. It covered the "BESTSELLER" label on the Butter cake premix card.
7. **Opened Butter cake premix.** A popup opens with the title, "Add eggs, butter and water. Easy for first-timers.", then a box "OUR QUALITY PROMISE… **all sales are final and non-refundable**", then "TOTAL VALUE RM 12.90". The ADD TO CART button is below the fold, so I had to scroll inside the popup. As a beginner I still don't know **how many eggs, how much butter, what tin size, how long to bake, or how big the cake is**. I also couldn't find butter or eggs in the shop.
8. **Added to cart.** The cart drawer slid in by itself: "BUTTER CAKE PREMIX 5…", RM 12.90, +/–, REMOVE, "CONTINUE TO ORDER". Nice. I added the 8-inch tin and whipping cream (it shows "❄ CHILLED"). A dark bar at the bottom appeared, "3 items RM 59.80 CHECKOUT". Good, but it stacks right under the floating CATEGORIES button.
9. **Checkout** (/checkout): order summary, a blue box about chilled items, then NAME, PHONE, FULFILMENT ("Self pickup at the shop" or "Courier pickup — you book Grab / Lalamove to collect from the shop"), COLLECTION DATE, COLLECTION TIME ("Between 6:30 AM and 1:00 PM"), notes, a terms checkbox, and "We'll confirm stock and send a payment QR on WhatsApp. No payment needed yet." Then "SEND ORDER ON WHATSAPP". The date and time boxes showed "17/10/2026" and "12:30" in grey. I thought today was already picked, but the fields were actually **empty**, and today isn't even allowed (the earliest date is tomorrow).
10. I typed 15:00 and got a clear red message, "Choose a time between 6:30 AM and 1:00 PM". Good. With 9:00 AM it submitted. It tried to open WhatsApp with a prefilled message (wa.me/60123456789 with "Hi Sim Baking House, I'd like to order… Order: SBH-0001… Estimated total: RM 12.90… Link: https://www.simbakinghouse.com.my/order/SBH-0001"), and the page moved to **/order/SBH-0001**: "Order received. Sim is checking stock." plus the item, "Collect: 19 Oct 2026, Time: 9:00 AM, Fulfilment: Self pickup". There was **no total, no "open WhatsApp" button, and no explanation of what happens next.** If WhatsApp hadn't opened, I wouldn't know whether Sim got my order.
11. **Search.** "cake" gave 6 results (sensible). "面粉" gave the 3 flours. "蛋糕" gave the premixes and the tin. "flor" and "choclate" gave "No product matches…" with a green "Ask Sim if it's in the shop" button and "Clear filters and show all". The fallback is nice, but there's no typo tolerance. "butter" returned only the butter cake premix, with no actual butter for sale. "egg" also returned only the premix. "sprinkles" and "iphone" returned nothing, with the Ask Sim button. The search box shows two clear buttons side by side (a grey ⓧ and a ✕).
12. **Categories drawer** (floating button): All Bakes, Baking, Dairy, Flour, Premix, Sugar, Tools, then "SHOP BY LEVEL", which showed only grey bars. The Beginner/Artisan options were not readable on the phone. There's no "first-time" entry in the drawer.
13. **Switched to 中文** (via the ☰ menu; the switch isn't in the phone header). The top half of the home page is translated well ("你的烘焙材料店", "第一次烘焙？从这里开始", "怎么下单" with three clear steps), and product names and the cart are translated too ("购物车", "去下单"). But "营业时间：Daily: 6:30 AM - 1:00 PM" mixes the two languages, and everything from "INGREDIENTS / TOOLS / DECORATIONS" down (Best sellers, story, Why us, contact) is English. The Products page title, categories ("FLOUR", "PREMIX"), "SHOWING 12 OF 12 PRODUCTS", the product description ("Add eggs, butter and water…"), the quality-promise box and **the whole checkout** stay in English. Terms of Sale offers EN/BM, not 中文.
14. **Location page:** full address "Tingkat Sungai Ara 1, Sungai Ara, 11900 Bayan Lepas, Pulau Pinang", hours, WhatsApp/Email links and "OPEN IN GOOGLE MAPS". The map box was blank in my test, probably only because I blocked external requests.
15. **About page:** a warm story about Sim. It says "we stock the same starter culture and high-protein bread flour she uses", but I didn't see a starter culture in the 12 products.
16. **Desktop (1280px):** looks tidy, with nav links, EN/中文 in the header, "CART", and the three order steps side by side. The desktop Products page shows a "Sim's Starter Kit — Everything you need to begin your baking journey" feature that I never saw on my phone.

## Confusing moments
- Prices are missing on every home-page product card, so I had to go elsewhere to learn if it's cheap.
- Tapping a product on the home page opens a list, not that product.
- "BEST SELLERS — No products available at the moment" right after three sections full of products.
- "Baking bundles" are separate products, not a bundle with one price.
- "Order online, collect next morning" (home footer) versus "Pick it up during opening hours". Can I collect today or not?
- The premix says "Add eggs, butter and water", but the shop doesn't seem to sell butter or eggs, and there are no amounts.
- The checkout date and time looked prefilled with today and 12:30 but were empty, and today isn't selectable.
- After sending, the order page doesn't say "Now check WhatsApp" or show the total.
- The "Butter 牛油" box in the hero drawing, but searching "butter"/"牛油" finds no butter.
- In 中文 mode, half the site and the entire checkout are still English.
- The About page promises a sourdough starter, but none is in the product list.
- A popup on the product says "all sales are final and non-refundable", which sounds harsher than the Terms (which do refund damaged or wrong items).

## Conversion blockers (things that would stop me buying) — numbered, most serious first; for each: what happened, where, why it stops me, a suggested fix
1. **No clear "what's next / reopen WhatsApp" after sending the order.**
   - *What happened:* After "SEND ORDER ON WHATSAPP", the page /order/SBH-0001 only says "Order received. Sim is checking stock." There's no total, no WhatsApp button, and no "expect a reply by…".
   - *Where:* Order confirmation page.
   - *Why it stops me:* The whole model depends on WhatsApp. If the app doesn't open (popup blocked, WhatsApp not installed, or I switch back to Safari), I don't know whether Sim got anything, how much I owe, or what to do. I'd assume it failed.
   - *Fix:* On the order page, add a big green "Open WhatsApp to send your order" button with the same prefilled message, the estimated total, and a short "What happens next: 1) send the WhatsApp message 2) Sim replies with a DuitNow QR 3) collect on <date>". Also say what to do if there's no reply.
2. **A beginner can't tell if the product will actually get them a cake.**
   - *What happened:* The Butter cake premix says only "Add eggs, butter and water. Easy for first-timers." It doesn't say how much, which tin, how long or at what temperature, or what size cake. Butter and eggs aren't sold (search "butter" and "egg" return only the premix).
   - *Where:* Product popup, and the "Baking for the first time?" collection.
   - *Why it stops me:* I'm scared of buying something and then finding I can't use it, especially with "all sales are final and non-refundable" in the same popup.
   - *Fix:* For first-timer products, add a short "You'll also need: 3 eggs, 125g butter, 100ml water; 8-inch tin; oven 170°C, 40 min; makes one 8-inch cake" plus "Pairs with: Round cake tin 8 inch [Add]". Make a real one-price "First butter cake kit" bundle.
3. **"BEST SELLERS — No products available at the moment. Check back soon!"**
   - *Where:* Home page, between "Not sure what to buy? Ask Sim" and the story section.
   - *Why it stops me:* It makes the shop look empty or broken right after showing products, and I trust the rest less.
   - *Fix:* Fill it with the products marked BESTSELLER or SIM'S PICK, or hide the section when it's empty.
4. **No prices and no real product links on the home-page collections.**
   - *What happened:* Cards in "Baking for the first time?", "Baking bundles" and "For regulars…" show only a placeholder image and a name, and every card links to the collection list.
   - *Why it stops me:* Price is the first thing I want to know. Making me hunt for it feels like the shop is hiding something.
   - *Fix:* Show "RM 12.90" on every card and open that product's details when I tap it.
5. **The Chinese version is half translated, including the whole checkout.**
   - *What happened:* After choosing 中文, the checkout labels (NAME, PHONE, FULFILMENT, COLLECTION DATE, "SEND ORDER ON WHATSAPP"), product descriptions, the quality-promise box, Products page labels and the lower half of the home page stay in English. Terms has no 中文.
   - *Why it stops me:* A Chinese-first customer (my parents, for example) would drop out exactly at checkout, which is the most important step.
   - *Fix:* Translate checkout, the order confirmation, product descriptions, category names, the remaining home sections, and the hours string ("每天 6:30 AM – 1:00 PM"). Add a 中文 Terms of Sale, or at least a 中文 summary.

## Smaller friction points — numbered; for each: what, where, suggested fix
1. **Floating "CATEGORIES" button covers product cards** (it hid the "BESTSELLER" tag) and sits right above the cart bar, so two floating things pile up. *Where:* Products page, phone. *Fix:* Put a sticky filter row at the top instead, or hide the floating button once the cart bar is visible.
2. **Product names are cut off and prices wrap** ("All-purpose flo…", "RM / 4.50"). *Where:* Products grid, phone. *Fix:* Put the price on its own line under the name, allow two-line names, and keep "RM 4.50" on one line.
3. **The date and time fields look prefilled** (grey "17/10/2026", "12:30") but are empty, and today is not allowed. *Where:* Checkout. *Fix:* Use a real placeholder ("Choose a day") or preselect the earliest valid date (tomorrow), and say "Earliest collection: tomorrow".
4. **Mixed messages on timing:** "Order online, collect next morning" versus "Pick it up during opening hours". *Where:* Home page contact card versus HOW TO ORDER. *Fix:* Use one rule everywhere, e.g. "Order by 1 PM, collect from the next morning".
5. **"SHOP BY LEVEL" in the Categories drawer shows grey bars**, so the Beginner/Artisan options weren't readable. *Where:* Categories drawer, phone. *Fix:* Fix the layout, and add "Baking for the first time?" to this drawer.
6. **No typo tolerance in search** ("flor", "choclate" return nothing). *Where:* Products search. *Fix:* Add simple fuzzy matching or "Did you mean flour?". Keep the "Ask Sim if it's in the shop" fallback, which is good.
7. **Two clear (×) buttons in the search box.** *Where:* Products search, iOS. *Fix:* Hide the native search-cancel button.
8. **The refund notice is scarier than the actual Terms.** "All sales are final and non-refundable" in every product popup, while the Terms say faulty, expired or wrong items are replaced or refunded within 24 hours. *Fix:* Change it to "No change-of-mind returns; damaged or wrong items replaced. Tell us within 24h."
9. **ADD TO CART is below the fold** in the product popup on the phone. *Fix:* Make the price and Add to cart sticky at the bottom of the popup.
10. **All product images are placeholders, and the hero says "Photo coming soon"**. *Where:* Everywhere. *Fix:* Even simple phone photos of the real packs on the shelf would build a lot of trust.
11. **"Baking bundles" isn't a bundle.** *Fix:* Rename it ("Goes well together") or sell actual bundles with one price.
12. **The About page promises a sourdough starter culture that isn't sold.** *Fix:* List it or remove the line.
13. **The language switch is hidden in the ☰ menu on the phone.** *Fix:* Put a small "EN | 中文" toggle in the phone header, as on desktop.
14. **The order page doesn't show the total or the order's chilled-item reminder.** *Fix:* Show the estimated total and repeat the "bring a cool bag" note for chilled items.
15. **The WhatsApp order message links to https://www.simbakinghouse.com.my/order/SBH-0001** even from this staging site. *Where:* The prefilled wa.me text. *Fix:* This is for the developer: check that the link uses the current site's address.
16. **The cart doesn't remind me "Pickup only, pay on WhatsApp"** before "CONTINUE TO ORDER". *Fix:* Add one line under the subtotal.

## Friction point status
| # | Friction point | Severity (blocker/major/minor) | Fixed? |
|---|---|---|---|
| B1 | Order page has no "open WhatsApp" button, total or next steps | blocker | fixed (re-check: fixed); headline now "Almost done… send it on WhatsApp" |
| B2 | Beginner can't tell what else is needed (amounts, tin, butter/eggs not sold) | blocker | partly: "Ask Sim what else I need" link + per-product "You will also need" field for Sim to fill (no invented amounts); no butter/eggs in the demo catalogue |
| B3 | "BEST SELLERS — No products available" on home page | major | fixed (re-check: fixed) |
| B4 | No prices and no product links on home-page collection cards | major | fixed (re-check: fixed) |
| B5 | Chinese version half translated, including all of checkout | major | partly: checkout, order page, cart, products page, hours, returns in 中文; product descriptions (no Chinese data yet), lower home sections, legal pages still English (BACKLOG) |
| F1 | Floating CATEGORIES button covers cards and stacks with the cart bar | major | fixed after re-check: floating button removed; Categories is a button in the results bar |
| F2 | Product names cut off and prices wrap on phone grid | minor | fixed (re-check: fixed) |
| F3 | Date/time fields look prefilled but are empty; today not allowed | major | partly: date preselected + "Earliest collection: tomorrow"; the native time box still shows a grey example time |
| F4 | "Collect next morning" vs "during opening hours" | minor | fixed (re-check: fixed) |
| F5 | "SHOP BY LEVEL" shows grey bars in Categories drawer | minor | fixed after re-check: collections now at the top of the drawer |
| F6 | No typo tolerance in search | minor | fixed after re-check: "flor" no longer matches "for" |
| F7 | Two clear buttons in the search box | minor | fixed (re-check: fixed) |
| F8 | "All sales final, non-refundable" harsher than the Terms | major | fixed (re-check: fixed); wording = Terms of Sale (OWNER-TO-CONFIRM #8) |
| F9 | ADD TO CART below the fold in product popup | minor | fixed after re-check: returns note moved below the buy area; Add to cart visible on a 375×812 screen (tested) |
| F10 | All product images are placeholders; "Photo coming soon" | major | not fixed: needs real photos (PHOTOS-NEEDED) |
| F11 | "Baking bundles" are not bundles | minor | not fixed: name as specified (OWNER-TO-CONFIRM #10) |
| F12 | About page promises a starter culture that isn't sold | minor | not fixed: owner copy (OWNER-TO-CONFIRM #11) |
| F13 | Language switch hidden in the ☰ menu on phone | minor | fixed (re-check: fixed); wordmark spacing tightened on phones |
| F14 | Order page lacks total and chilled reminder | minor | fixed (re-check: fixed) |
| F15 | WhatsApp order message links to the production domain from staging | minor | fixed (re-check: fixed) |
| F16 | Cart doesn't restate "pickup only, pay on WhatsApp" | minor | fixed (re-check: fixed) |

## Scores (1–10, one line of reasoning each)
- **Clarity of what the shop is: 8.** "BAKING SUPPLY SHOP · BAYAN LEPAS, PENANG / Your baking supply shop" is clear right away. I took points off for no real photos.
- **Trust: 5.** The address, hours, story and clear Terms help, but placeholder images everywhere, "Photo coming soon", an empty "Best sellers" section and a harsh "non-refundable" box hurt.
- **Ease of finding a first-bake product: 7.** "NEW TO BAKING? START HERE" leads straight to 4 sensible items. It loses points for no prices on the home page and no "what else you need" guidance.
- **Search: 6.** It's fast, works in English and Chinese (面粉, 蛋糕), and the "Ask Sim" fallback is great. There's no typo tolerance and a double clear button.
- **Understanding how to order/pay/collect: 8.** The HOW TO ORDER box is excellent. The after-order page then drops the ball.
- **Mobile usability: 6.** The cart drawer, the bottom cart bar and inline time validation are good. Truncated names, wrapping prices, an overlapping floating button, the off-screen Add to cart and confusing date fields drag it down.
- **Chinese experience: 4.** The hero, how-to-order, product names and cart are good in 中文. Checkout, descriptions and half the home page are still English.
- **Overall: 6.** It's friendly and honest, with a clear ordering model, but it feels unfinished, and the end of the order flow leaves a beginner unsure.

## Would I buy?
**Maybe.** The "HOW TO ORDER" steps and "No question is too basic" make me feel welcome, and RM 12.90 for a premix plus RM 25.00 for a tin is reasonable for a first try. But I'd probably tap "Ask Sim on WhatsApp" first to ask what else I need for the butter cake, because the product page doesn't tell me, and the shop doesn't seem to sell butter or eggs. And after sending the order I'd be unsure whether it went through, since the confirmation page has no WhatsApp button or total. With real photos, prices on the home page, a "you'll also need…" note, and a clear "now send this on WhatsApp" step after ordering, this becomes a yes.

---

## Re-check after fixes (date 2026-10-17)

*(Second pass by the same isolated review agent on a fresh build; its words, unchanged.)*

I tested the fresh build at http://localhost:3100 on a 375x812 WebKit phone (iPhone UA, touch), with every non-localhost request blocked, and looked at the screenshots. I placed two fake test orders with the earliest slot allowed (tomorrow, 18 Oct 2026, at 6:30 AM): SBH-0001 in English and SBH-0002 in 中文. No real WhatsApp message was sent; I only read the button links. On this build, sending the order did not try to open WhatsApp automatically. It went straight to the order page, which asks me to tap the button.

### Friction point status after fixes
| # | Friction point | Severity | Fixed? |
|---|---|---|---|
| B1 | Order page has no "open WhatsApp" button, total or next steps | blocker | **fixed**: the order page now has a green box "One more step: send your order on WhatsApp… If WhatsApp did not open, tap the button" with a "Send order on WhatsApp" button (message prefilled with order no., name, items, total). It also shows "Estimated total: RM 34.80", a 3-step "WHAT HAPPENS NEXT" list and "No reply by the next opening time? Message Sim again." |
| B2 | Beginner can't tell what else is needed (amounts, tin, butter/eggs not sold) | blocker | **partly fixed**: the popup now has a green "Not sure what else you need for this? Ask Sim" link, which opens WhatsApp with "I want to buy Butter cake premix 500g. What else do I need?". Still missing: the description is still only "Add eggs, butter and water", with no amounts, tin size, oven time or cake size. There's still no butter or eggs in the shop and no "goes with: 8-inch tin [Add]". |
| B3 | "BEST SELLERS — No products available" on home page | major | **fixed**: the empty section is gone. |
| B4 | No prices and no product links on home-page collection cards | major | **fixed**: every card shows a price in red (e.g. "RM 12.90"). Tapping a card opens that product's popup inside its collection, e.g. `/products?collection=first-time&product=p-butter-premix`. |
| B5 | Chinese version half translated, including all of checkout | major | **partly fixed**: checkout (结账, 姓名, 电话, 取货方式, 最早取货：明天, "用 WHATSAPP 发送订单"), the order page (还差一步…, 预计总额, 接下来), the cart, the Products page header (产品, 显示 12 / 12 个产品, 分类), the returns box (退换说明…) and the hero hours (每天 6:30 AM - 1:00 PM) are now in Chinese. Still English: the product description ("Add eggs, butter and water…"), "TOTAL VALUE / QTY", category tags (FLOUR, PREMIX, TOOLS), "SIM'S PICK / BESTSELLER" and the "Product Image" placeholder text. On the order page the items are in English ("1 x Butter cake premix 500g") and the WhatsApp message is always English. Everything on the home page below "常客与家庭烘焙生意" is English, plus the footer, About, Location and Terms (still only EN/BM). |
| F1 | Floating CATEGORIES button covers cards and stacks with the cart bar | major | **partly fixed**: once something is in the cart, the floating button is gone and only the cart bar shows, which is good. With an empty cart, the floating button still sits on the cards: it hid "RM 16.90" under Cocoa powder (EN) and overlapped the "SIM'S PICK" tag (中文 "分类"). |
| F2 | Product names cut off and prices wrap on phone grid | minor | **fixed**: names wrap to two lines ("Chocolate cake premix / 500g") and the price sits on its own line ("RM 4.50"). |
| F3 | Date/time fields look prefilled but are empty; today not allowed | major | **partly fixed**: the date is now really preselected (18/10/2026) with the hint "Earliest collection: tomorrow". The time field is still empty but shows a grey "12:30" that looks filled in. |
| F4 | "Collect next morning" vs "during opening hours" | minor | **fixed**: HOW TO ORDER now says "Pick it up from the next day, during opening hours", which agrees with "Order online, collect next morning". |
| F5 | "SHOP BY LEVEL" shows grey bars in Categories drawer | minor | **partly fixed**: "Shop by level" is gone, and the drawer now lists the collections. Only "Baking for the first time?" is visible, with a grey scroll bar under it. "Baking bundles" and "For regulars…" are only reachable by scrolling sideways, which I wouldn't think of doing. |
| F6 | No typo tolerance in search | minor | **partly fixed**: "choclate" now finds Chocolate cake premix, and "flor" finds the three flours. But "flor" shows "7 of 7 products", which also includes Butter cake premix, Cream cheese, Instant yeast and Whipping cream. That's too loose. |
| F7 | Two clear buttons in the search box | minor | **fixed**: there's only one ✕ now. |
| F8 | "All sales final, non-refundable" harsher than the Terms | major | **fixed**: it now says "RETURNS — No returns for change of mind. Damaged, expired or wrong item? Tell us within 24 hours of collection, with a photo, and we will replace or refund it." (also in 中文). |
| F9 | ADD TO CART below the fold in product popup | minor | **not fixed**: on 375x812 the popup still opens with the image, title, Ask Sim link and Returns box. TOTAL VALUE and ADD TO CART are below the fold, so I still have to scroll inside the popup. |
| F10 | All product images are placeholders; "Photo coming soon" | major | **not fixed**: everything still shows the tan blob "Product Image" and "Photo coming soon: flours, premixes and tools on our shelves". |
| F11 | "Baking bundles" are not bundles | minor | **not fixed**: still "Baking bundles — Ingredients that go together for one bake", showing four separate products. |
| F12 | About page promises a starter culture that isn't sold | minor | **not fixed**: About still says "we stock the same starter culture and high-protein bread flour she uses herself"; the shop still has 12 products and no starter. |
| F13 | Language switch hidden in the ☰ menu on phone | minor | **fixed**: there's now a "中文" / "EN" button in the phone header (but see the new issues). |
| F14 | Order page lacks total and chilled reminder | minor | **fixed**: "Estimated total: RM 34.80" and the blue chilled note ("bring a cool bag…") are on the order page. |
| F15 | WhatsApp order message links to the production domain from staging | minor | **fixed**: the message's link is now `http://localhost:3100/order/SBH-0001`, i.e. the site I'm on. |
| F16 | Cart doesn't restate "pickup only, pay on WhatsApp" | minor | **fixed**: under the subtotal it now says "Collect at the shop (or send your own courier). You pay on WhatsApp after Sim confirms." (中文: "到店自取（或自叫快递）。Sim 确认后在 WhatsApp 付款。"). |

### New issues found
1. **The header language button crowds the logo.** On the phone the boxed "中文"/"EN" button sits right against "SIM · BAKING · HOUSE", with the last letter almost touching the box. It looks cramped, and the logo is no longer centred.
2. **The 中文 order page loses its side margins.** On /order/SBH-0002 in Chinese, the text and the green box start about 4px from the left edge of the screen. The English order page has a normal gutter.
3. **"Order received" before the order is really sent.** The order page headline says "Order received. Sim is checking stock." (订单已收到，Sim 正在确认库存), but right below it says Sim only gets the order from my WhatsApp message. As a first-timer I might stop reading at "Order received" and never send the WhatsApp message. Something like "Almost done — send it on WhatsApp" would be clearer.
4. **Sending no longer opens WhatsApp by itself** (at least in my test browser). Now I have to tap the button on the order page. The page explains this clearly, so it's fine, but it adds one tap.
5. **Chilled note says "(Chilled)" twice:** "…bring a cool bag if you are travelling far. (Chilled)" in the cart and checkout. The 中文 version ends with "(冷藏)". It looks like a stray label.
6. **The search "flor" result count is noisy:** 7 results for a 3-flour search, which made me doubt the search (also listed under F6).

### Scores after fixes
- **Clarity of what the shop is: 8.** Same clear hero and headline. Still no real photos.
- **Trust: 6.** The empty Best Sellers section is gone and the returns wording is fair now. Placeholder images everywhere still make it feel unfinished.
- **Ease of finding a first-bake product: 8.** Prices are on the home page, cards open the product, and there's an "Ask Sim what else I need" link. It still doesn't tell me the amounts or tin, and there's no butter or eggs.
- **Search: 7.** Typos now find things and there's only one clear button. "flor" pulls in unrelated items.
- **Understanding how to order/pay/collect: 9.** The order page now spells out the WhatsApp step, total and next steps, and the cart line and "Earliest collection: tomorrow" help.
- **Mobile usability: 7.** The grid reads better and the cart bar replaces the floating button. ADD TO CART is still below the fold, the floating button still covers prices with an empty cart, and the header is cramped.
- **Chinese experience: 6.** Checkout, cart and order page now work in 中文. Descriptions, tags, the lower home page, the footer and the WhatsApp message are still English, and the order page margin breaks.
- **Overall: 7.** The order flow went from confusing to reassuring. What's left is mostly polish and missing real content (photos, recipe amounts).

### Would I buy now?
**Yes, probably.** The thing that worried me most is fixed. After sending the order I now see "One more step: send your order on WhatsApp", a big button, the estimated total (RM 34.80) and what happens next. I know I'll pay by DuitNow QR only after Sim confirms, and that I can collect from tomorrow at 6:30 AM. Seeing prices on the home page and a fair returns note also helps. I'd still tap "Not sure what else you need for this? Ask Sim" before ordering, because the premix still doesn't tell me how many eggs or how much butter, and the shop doesn't sell those. Real product photos would take away my last doubt that this shop is real and stocked.

---

## Fixes after the re-check (developer)

| Item | Change | Verified |
|---|---|---|
| F1 | Floating Categories button removed; Categories is a bordered button in the results bar | storefront suite |
| F5 | Collections moved to the top of the Categories drawer | by code; not re-reviewed |
| F6 / new 6 | Typo matching ignores words under 4 letters ("flor" no longer matches "for") | unit test |
| F9 | Returns note moved below the buy area, shorter phone image: Add to cart visible on 375×812 | storefront suite (asserts the button is on screen) |
| New 1 | Phone wordmark letter-spacing tightened next to the 中文 button | screenshot |
| New 2 | Chinese order page margin: not reproduced; the suite now submits a Chinese order at 375 px and asserts no sideways scroll and a ≥ 12 px left margin | storefront suite |
| New 3 | Headline now "Almost done: your order is saved. Now send it to Sim on WhatsApp." (中文 too) | — |
| New 4 | Not changed: checkout still calls `window.open` for WhatsApp; the test browser blocks pop-ups after an await. The order page button covers this. | — |
| New 5 | Stray "(Chilled)" label removed from the notice | — |

Still open, all need Sim: real photos (PHOTOS-NEEDED), "You will also need" text per first-timer product and whether butter/eggs are sold, bundle naming, About copy, Chinese product descriptions (needs a `descriptionZh` field: BACKLOG).
