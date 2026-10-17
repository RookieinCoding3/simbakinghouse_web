// Storefront words in English and Chinese (simplified). One table so both
// languages stay in step; `{name}` placeholders are filled by t().
// Chinese wording to be checked by Sim (docs/OWNER-TO-CONFIRM.md).

export type Lang = 'en' | 'zh'

export const STRINGS = {
  // header / nav
  'nav.home': ['Home', '首页'],
  'nav.about': ['About', '关于我们'],
  'nav.products': ['Products', '产品'],
  'nav.location': ['Location', '位置'],
  'lang.switch': ['Language', '语言'],

  // hero
  'hero.eyebrow': ['Baking supply shop · Bayan Lepas, Penang', '烘焙材料店 · 槟城峇六拜'],
  'hero.title': ['Your baking supply shop', '你的烘焙材料店'],
  'hero.sub': [
    'Your friendly neighbourhood baking supply shop in Bayan Lepas. Quality flours, foolproof premixes, tools, and zero-intimidation advice for home bakers.',
    '峇六拜的邻里烘焙材料店。优质面粉、零失败预拌粉、烘焙工具，还有给家庭烘焙者的耐心建议，什么都可以问。',
  ],
  'hero.browse': ['Browse baking ingredients', '看看烘焙材料'],
  'hero.start': ['New to baking? Start here', '第一次烘焙？从这里开始'],
  'hero.hours': ['Open {hours}', '营业时间：{hours}'],
  'hero.photo': ['Photo coming soon: flours, premixes and tools on our shelves', '照片即将更新：店里的面粉、预拌粉和工具'],

  // how to order
  'howto.title': ['How to order', '怎么下单'],
  'howto.1.title': ['Pick items online', '在网上选好材料'],
  'howto.1.body': ['Add what you need to the cart and send your order. Nothing to pay yet.', '把需要的加进购物车，送出订单。现在还不用付款。'],
  'howto.2.title': ['Confirm and pay on WhatsApp', '在 WhatsApp 确认并付款'],
  'howto.2.body': ['Sim checks the shelf, confirms your order and sends you a DuitNow QR.', 'Sim 先看货架确认有货，再把 DuitNow 二维码发给你。'],
  'howto.3.title': ['Collect at the shop', '到店自取'],
  'howto.3.body': [
    'Pick it up from the next day, during opening hours ({hours}), or book your own Grab or Lalamove courier to collect. We don’t deliver.',
    '第二天起，在营业时间内（{hours}）到店取货，或自己叫 Grab / Lalamove 来取。我们不提供送货。',
  ],

  // ask sim
  'ask.title': ['Not sure what to buy? Ask Sim', '不知道该买什么？问 Sim'],
  'ask.body': [
    'Tell Sim what you want to bake, and Sim will tell you what you need. No question is too basic.',
    '告诉 Sim 你想做什么，Sim 会告诉你需要哪些材料。再简单的问题也可以问。',
  ],
  'ask.button': ['Ask Sim on WhatsApp', '在 WhatsApp 问 Sim'],
  'ask.prefill': ['Hi Sim, I would like some baking advice.', 'Sim 你好，我想请教一些烘焙问题。'],
  'ask.short': ['Ask Sim', '问 Sim'],

  // collections
  'col.first-time.title': ['Baking for the first time?', '第一次烘焙？'],
  'col.first-time.body': ['Easy, forgiving products to start with.', '容易上手、不容易失败的材料。'],
  'col.bundles.title': ['Baking bundles', '烘焙组合'],
  'col.bundles.body': ['Ingredients that go together for one bake.', '一次烘焙会用到的材料，放在一起。'],
  'col.regulars.title': ['For regulars and home businesses', '常客与家庭烘焙生意'],
  'col.regulars.body': ['The staples you use every week.', '每周都会用到的常备材料。'],
  'col.seeAll': ['See all products', '查看全部产品'],

  // product / cart
  'product.chilled': ['Chilled', '冷藏'],
  'product.askPrice': ['Ask for price', '价格请询问'],
  'product.add': ['Add to cart', '加入购物车'],
  'product.from': ['from', '起价'],
  'stock.in_stock': ['In stock', '有货'],
  'stock.low': ['Low stock', '库存不多'],
  'stock.out': ['Out of stock', '缺货'],
  'stock.ask_us': ['Ask us', '请询问'],
  'cart.title': ['Cart', '购物车'],
  'cart.empty': ['Your cart is empty.', '购物车是空的。'],
  'cart.subtotal': ['Subtotal', '小计'],
  'cart.unpriced': ['Some items are priced on request. Sim will confirm the total.', '部分商品需询价，Sim 会确认总价。'],
  'cart.continue': ['Continue to order', '去下单'],
  'cart.remove': ['Remove', '删除'],
  'cart.close': ['Close cart', '关闭购物车'],
  'cart.chilledNote': ['Chilled items in your cart', '购物车里有冷藏商品'],
  'sticky.items': ['{n} items', '{n} 件'],
  'sticky.item': ['1 item', '1 件'],
  'sticky.checkout': ['Checkout', '去下单'],

  // search
  'search.placeholder': ['Search flour, 面粉, or a code', '搜索：面粉、flour 或编号'],
  'search.label': ['Search products', '搜索产品'],
  'search.none': ['No product matches “{q}”.', '找不到“{q}”。'],
  'search.askSim': ['Ask Sim if it’s in the shop', '问 Sim 店里有没有'],
  'search.askPrefill': ['Hi Sim, do you have: {q}?', 'Sim 你好，请问有没有：{q}？'],
  'search.clear': ['Clear search', '清除搜索'],
  'search.count': ['{n} products', '{n} 个产品'],

  // checkout
  'co.title': ['Checkout', '结账'],
  'co.name': ['Name', '姓名'],
  'co.phone': ['Phone', '电话'],
  'co.fulfilment': ['How you collect', '取货方式'],
  'co.pickup': ['Self pickup at the shop', '到店自取'],
  'co.courier': ['Courier pickup — you book Grab / Lalamove to collect from the shop', '自叫快递 — 你自己叫 Grab / Lalamove 来店里取货'],
  'co.courierPh': ['Courier details (e.g. Grab, driver will come at 11am)', '快递资料（例如：Grab，司机 11 点来）'],
  'co.date': ['Collection date', '取货日期'],
  'co.dateHint': ['Earliest collection: tomorrow', '最早取货：明天'],
  'co.time': ['Collection time', '取货时间'],
  'co.timeHint': ['Between {open} and {close}', '{open} 至 {close} 之间'],
  'co.timeError': ['Choose a time between {open} and {close}', '请选择 {open} 至 {close} 之间的时间'],
  'co.notes': ['Notes (optional)', '备注（可不填）'],
  'co.agree': ['I agree to the', '我同意'],
  'co.privacy': ['Privacy Notice', '隐私声明'],
  'co.and': ['and', '和'],
  'co.terms': ['Terms of Sale', '销售条款'],
  'co.info': ['We’ll confirm stock and send a payment QR on WhatsApp. No payment needed yet.', '我们会在 WhatsApp 确认有货并发付款二维码。现在不用付款。'],
  'co.send': ['Send order on WhatsApp', '用 WhatsApp 发送订单'],
  'co.sending': ['Sending…', '发送中…'],
  'co.err.name': ['Enter your name', '请填写姓名'],
  'co.err.phone': ['Enter a valid Malaysian phone number', '请填写有效的马来西亚电话号码'],
  'co.err.date': ['Choose a collection date', '请选择取货日期'],
  'co.err.time': ['Choose a collection time', '请选择取货时间'],
  'co.err.consent': ['Please agree to the storage of your details to continue', '请先同意保存你的资料'],
  'co.err.generic': ['Something went wrong, please try again', '出错了，请再试一次'],
  'co.empty': ['Your cart is empty', '购物车是空的'],
  'co.emptyBody': ['Add something from our products before checking out.', '请先从产品里选好要买的东西。'],
  'co.browse': ['Browse products', '看看产品'],
  'cart.howItWorks': ['Collect at the shop (or send your own courier). You pay on WhatsApp after Sim confirms.', '到店自取（或自叫快递）。Sim 确认后在 WhatsApp 付款。'],

  // order page
  'order.label': ['Order', '订单'],
  'order.received': ['Almost done: your order is saved. Now send it to Sim on WhatsApp.', '快好了：订单已保存。现在请用 WhatsApp 发给 Sim。'],
  'order.sendTitle': ['One more step: send your order on WhatsApp', '还差一步：用 WhatsApp 发送订单'],
  'order.sendBody': ['Sim gets your order from your WhatsApp message. If WhatsApp did not open, tap the button.', 'Sim 是从你的 WhatsApp 讯息收到订单的。如果 WhatsApp 没有打开，请点下面的按钮。'],
  'order.sendButton': ['Send order on WhatsApp', '用 WhatsApp 发送订单'],
  'order.estTotal': ['Estimated total', '预计总额'],
  'order.plusAsk': ['+ items with price to confirm', '+ 待确认价格的商品'],
  'order.next': ['What happens next', '接下来'],
  'order.next1': ['Send the WhatsApp message (button above).', '发送 WhatsApp 讯息（上面的按钮）。'],
  'order.next2': ['Sim checks the shelf and replies with the final total and a DuitNow QR. Nothing to pay before that.', 'Sim 看过货架后会回复最终总额和 DuitNow 二维码。在那之前不用付款。'],
  'order.next3': ['Collect on {date} at {time}.', '{date} {time} 取货。'],
  'order.noReply': ['No reply by the next opening time ({hours})? Message Sim again.', '到下一个营业时间（{hours}）还没回复？请再发讯息给 Sim。'],
  'order.question': ['Ask about this order on WhatsApp', '在 WhatsApp 询问这张订单'],
  'order.collect': ['Collect', '取货日期'],
  'order.time': ['Time', '时间'],
  'order.fulfilment': ['Collection', '取货方式'],
  'order.pickup': ['Self pickup', '到店自取'],
  'order.courier': ['Courier pickup (Grab / Lalamove)', '自叫快递（Grab / Lalamove）'],

  // products page
  'products.title': ['Products', '产品'],
  'products.showing': ['Showing {shown} of {total} products', '显示 {shown} / {total} 个产品'],
  'products.categories': ['Categories', '分类'],
  'products.clear': ['Clear filters', '清除筛选'],
  'products.showAll': ['Clear filters and show all', '清除筛选，显示全部'],
  'products.none': ['No products found', '没有找到产品'],
  'products.more': ['Discover more', '查看更多'],
  'products.unsure': ['Not sure what else you need for this? Ask Sim', '不知道还需要什么？问 Sim'],
  'products.unsurePrefill': ['Hi Sim, I want to buy {name}. What else do I need?', 'Sim 你好，我想买{name}，还需要什么材料？'],
  'products.alsoNeed': ['You will also need', '你还需要'],

  // home: older sections
  'home.bestSellers': ['Best sellers', '热卖'],
  'returns.title': ['Returns', '退换说明'],
  'returns.body': [
    'No returns for change of mind. Damaged, expired or wrong item? Tell us within 24 hours of collection, with a photo, and we will replace or refund it.',
    '不接受因改变主意而退货。如果商品损坏、过期或不是你订的，请在取货后 24 小时内附照片告诉我们，我们会换货或退款。',
  ],
  'hours.daily': ['Daily', '每天'],

  // language line
  'lang.line': ['We speak English, Bahasa Melayu and 中文', '我们会说英语、马来语和中文'],
} as const satisfies Record<string, readonly [string, string]>

export type StringKey = keyof typeof STRINGS

export function translate(lang: Lang, key: StringKey, vars?: Record<string, string | number>): string {
  const text: string = STRINGS[key][lang === 'zh' ? 1 : 0]
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : text
}

/** "Daily: 6:30 AM - 1:00 PM" (from Settings) in the chosen language. */
export function localizeHours(lang: Lang, hours: string): string {
  return lang === 'zh' ? hours.replace(/^\s*Daily:?\s*/i, '每天 ') : hours
}
