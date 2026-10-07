// Proves the order-abuse protections in app/api/orders actually work,
// against a real local server (see scripts/run-order-abuse-tests.sh) and
// the Firestore emulator — never production. Each assertion hits real
// HTTP, not mocked internals, so this is proof of the deployed behavior,
// not just of the helper functions in isolation.
//
// Run via: npm run test:order-abuse (wraps this with the emulator + server)
import { db } from './lib/emu.mjs'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3100'

let passed = 0
let failed = 0

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function phoneFor(n) {
  return `60${String(100000000 + n)}`
}

async function getToken() {
  const res = await fetch(`${BASE_URL}/api/checkout/token`)
  return res.json()
}

function validOrderBody({ phone, token, productId = 'test-flour-1kg', qty = 1, honeypot = '', priceOverride, items }) {
  const item = { productId, name: 'Whatever the client claims', qty }
  if (priceOverride !== undefined) item.unitPriceSnapshot = priceOverride
  return {
    customerName: 'Test Customer',
    customerPhone: phone,
    fulfilment: 'pickup',
    collectDate: new Date(Date.now() + 86400_000).toISOString().slice(0, 10),
    collectTime: '08:00',
    notes: '',
    items: items ?? [item],
    company: honeypot,
    formIssuedAt: token.issuedAt,
    formToken: token.token,
  }
}

async function postOrder(body, extraHeaders = {}) {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

async function check(name, run) {
  try {
    await run()
    console.log(`PASS  ${name}`)
    passed++
  } catch (e) {
    console.log(`FAIL  ${name}`)
    console.log(`      ${e.message}`)
    failed++
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

// --- Positive controls: a genuine order still works ---

await check('a valid order is accepted and priced from Firestore (RM12.50), not from the client', async () => {
  const token = await getToken()
  await sleep(3100)
  const { status, json } = await postOrder(validOrderBody({ phone: phoneFor(1), token }))
  assert(status === 201, `expected 201, got ${status}: ${JSON.stringify(json)}`)
  assert(json.estimatedTotal === 12.5, `expected RM12.50 from Firestore, got ${json.estimatedTotal}`)
})

await check('a spoofed client-side price (RM0.01) is ignored — real Firestore price is still charged', async () => {
  const token = await getToken()
  await sleep(3100)
  const { status, json } = await postOrder(
    validOrderBody({ phone: phoneFor(2), token, priceOverride: 0.01 })
  )
  assert(status === 201, `expected 201, got ${status}: ${JSON.stringify(json)}`)
  assert(json.estimatedTotal === 12.5, `expected the spoofed 0.01 to be ignored, got ${json.estimatedTotal}`)
})

// --- Server-side validation ---

await check('a non-existent product ID is rejected, not silently priced at 0', async () => {
  const token = await getToken()
  await sleep(3100)
  const { status, json } = await postOrder(
    validOrderBody({ phone: phoneFor(3), token, productId: 'does-not-exist-xyz' })
  )
  assert(status === 400, `expected 400, got ${status}: ${JSON.stringify(json)}`)
})

await check('qty 0 is rejected', async () => {
  const token = await getToken()
  await sleep(3100)
  const { status } = await postOrder(validOrderBody({ phone: phoneFor(4), token, qty: 0 }))
  assert(status === 400, `expected 400, got ${status}`)
})

await check('qty 100 (over MAX_QTY 99) is rejected', async () => {
  const token = await getToken()
  await sleep(3100)
  const { status } = await postOrder(validOrderBody({ phone: phoneFor(5), token, qty: 100 }))
  assert(status === 400, `expected 400, got ${status}`)
})

// --- "Ask for price" products (no price set): orderable, left out of the
// total, order flagged priceToConfirm. Each check uses its own IP so these
// don't eat into the shared localhost IP budget. ---

await check('an "Ask for price"-only order is accepted: total RM0, flagged price to confirm', async () => {
  const token = await getToken()
  await sleep(3100)
  const { status, json } = await postOrder(
    validOrderBody({ phone: phoneFor(20), token, productId: 'test-ask-price', qty: 2 }),
    { 'x-forwarded-for': '203.0.113.20' }
  )
  assert(status === 201, `expected 201, got ${status}: ${JSON.stringify(json)}`)
  assert(json.estimatedTotal === 0, `expected RM0 estimate, got ${json.estimatedTotal}`)
  assert(json.priceToConfirm === true, `expected priceToConfirm true, got ${json.priceToConfirm}`)
  const order = (await db().collection('orders').doc(json.orderId).get()).data()
  assert(order.priceToConfirm === true, 'stored order should be flagged priceToConfirm')
  assert(order.items[0].unitPriceSnapshot === null, `expected null line price, got ${order.items[0].unitPriceSnapshot}`)
  assert(order.items[0].name === 'Test Wedding Cake Topper', 'line name should come from Firestore, not the client')
})

await check('a mixed cart: priced line counted (2 x RM12.50), "Ask for price" line left out of the total', async () => {
  const token = await getToken()
  await sleep(3100)
  const { status, json } = await postOrder(
    validOrderBody({
      phone: phoneFor(21),
      token,
      items: [
        { productId: 'test-flour-1kg', name: 'x', qty: 2 },
        { productId: 'test-ask-price', name: 'x', qty: 1 },
      ],
    }),
    { 'x-forwarded-for': '203.0.113.21' }
  )
  assert(status === 201, `expected 201, got ${status}: ${JSON.stringify(json)}`)
  assert(json.estimatedTotal === 25, `expected RM25.00, got ${json.estimatedTotal}`)
  assert(json.priceToConfirm === true, 'mixed cart should be flagged priceToConfirm')
})

await check('a fully priced order is NOT flagged price to confirm', async () => {
  const token = await getToken()
  await sleep(3100)
  const { status, json } = await postOrder(validOrderBody({ phone: phoneFor(22), token }), {
    'x-forwarded-for': '203.0.113.22',
  })
  assert(status === 201, `expected 201, got ${status}: ${JSON.stringify(json)}`)
  assert(json.priceToConfirm === false, `expected priceToConfirm false, got ${json.priceToConfirm}`)
  const order = (await db().collection('orders').doc(json.orderId).get()).data()
  assert(order.priceToConfirm === false, 'stored order should have priceToConfirm false')
})

await check('a spoofed price on an "Ask for price" item (RM999) is ignored: line stays unpriced, total RM0', async () => {
  const token = await getToken()
  await sleep(3100)
  const { status, json } = await postOrder(
    validOrderBody({ phone: phoneFor(23), token, productId: 'test-ask-price', priceOverride: 999 }),
    { 'x-forwarded-for': '203.0.113.23' }
  )
  assert(status === 201, `expected 201, got ${status}: ${JSON.stringify(json)}`)
  assert(json.estimatedTotal === 0, `expected the spoofed 999 to be ignored, got ${json.estimatedTotal}`)
  const order = (await db().collection('orders').doc(json.orderId).get()).data()
  assert(order.items[0].unitPriceSnapshot === null, `spoofed price leaked into the order: ${order.items[0].unitPriceSnapshot}`)
})

for (const [label, productId, n] of [
  ['a fake product ID mixed with an "Ask for price" item', 'does-not-exist-abc', 24],
  ['a soft-deleted product', 'test-deleted', 25],
  ['an inactive product', 'test-inactive', 26],
]) {
  await check(`${label} is still rejected (400)`, async () => {
    const token = await getToken()
    await sleep(3100)
    const { status, json } = await postOrder(
      validOrderBody({
        phone: phoneFor(n),
        token,
        items: [
          { productId: 'test-ask-price', name: 'x', qty: 1 },
          { productId, name: 'x', qty: 1 },
        ],
      }),
      { 'x-forwarded-for': `203.0.113.${n}` }
    )
    assert(status === 400, `expected 400, got ${status}: ${JSON.stringify(json)}`)
    assert(/no longer available/.test(json.error || ''), `unexpected error: ${json.error}`)
  })
}

// --- Bot defense ---

await check('a filled honeypot field is rejected', async () => {
  const token = await getToken()
  await sleep(3100)
  const { status, json } = await postOrder(
    validOrderBody({ phone: phoneFor(6), token, honeypot: 'http://spam.example' })
  )
  assert(status === 400, `expected 400, got ${status}: ${JSON.stringify(json)}`)
})

await check('submitting under 3 seconds after the form token was issued is rejected', async () => {
  const token = await getToken() // deliberately NOT aged
  const { status, json } = await postOrder(validOrderBody({ phone: phoneFor(7), token }))
  assert(status === 400, `expected 400, got ${status}: ${JSON.stringify(json)}`)
})

await check('a missing/forged form token is rejected', async () => {
  const { status } = await postOrder(
    validOrderBody({ phone: phoneFor(8), token: { issuedAt: Date.now() - 10_000, token: 'forged' } })
  )
  assert(status === 400, `expected 400, got ${status}`)
})

// --- Rate limiting: per-phone (3/hour) ---

await check('20 rapid orders from the SAME phone: exactly 3 succeed, the rest are blocked (429)', async () => {
  const phone = phoneFor(9)
  const tokens = await Promise.all(Array.from({ length: 20 }, () => getToken()))
  await sleep(3100)
  const results = await Promise.all(tokens.map((token) => postOrder(validOrderBody({ phone, token }))))
  const ok = results.filter((r) => r.status === 201).length
  const blocked = results.filter((r) => r.status === 429).length
  assert(ok === 3, `expected exactly 3 orders to succeed (phone limit is 3/hour), got ${ok}`)
  assert(blocked === 17, `expected the remaining 17 to be 429, got ${blocked}`)
  assert(
    results.every((r) => r.status === 201 || (r.status === 429 && /Too many orders/.test(r.json.error || ''))),
    'every blocked response should carry a clear retry message'
  )
})

// --- Rate limiting: per-IP (10/hour), isolated from the phone limit by
// using a different phone for every request ---

await check('11 rapid orders from 11 DIFFERENT phones but the SAME IP: exactly 10 succeed, 1 is blocked', async () => {
  const sharedIp = '203.0.113.50'
  const tokens = await Promise.all(Array.from({ length: 11 }, () => getToken()))
  await sleep(3100)
  const results = await Promise.all(
    tokens.map((token, i) =>
      postOrder(validOrderBody({ phone: phoneFor(100 + i), token }), { 'x-forwarded-for': sharedIp })
    )
  )
  const ok = results.filter((r) => r.status === 201).length
  const blocked = results.filter((r) => r.status === 429).length
  assert(ok === 10, `expected exactly 10 orders to succeed (IP limit is 10/hour), got ${ok}`)
  assert(blocked === 1, `expected exactly 1 to be blocked, got ${blocked}`)
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
