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
    'Pick it up during opening hours ({hours}), or book your own Grab or Lalamove courier to collect. We don’t deliver.',
    '营业时间内（{hours}）到店取货，或自己叫 Grab / Lalamove 来取。我们不提供送货。',
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

  // language line
  'lang.line': ['We speak English, Bahasa Melayu and 中文', '我们会说英语、马来语和中文'],
} as const satisfies Record<string, readonly [string, string]>

export type StringKey = keyof typeof STRINGS

export function translate(lang: Lang, key: StringKey, vars?: Record<string, string | number>): string {
  const text: string = STRINGS[key][lang === 'zh' ? 1 : 0]
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : text
}
