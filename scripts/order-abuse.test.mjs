// Proves the order-abuse protections in app/api/orders actually work,
// against a real local server (see scripts/run-order-abuse-tests.sh) and
// the Firestore emulator — never production. Each assertion hits real
// HTTP, not mocked internals, so this is proof of the deployed behavior,
// not just of the helper functions in isolation.
//
// Run via: npm run test:order-abuse (wraps this with the emulator + server)
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

function validOrderBody({ phone, token, productId = 'test-flour-1kg', qty = 1, honeypot = '', priceOverride }) {
  const item = { productId, name: 'Whatever the client claims', qty }
  if (priceOverride !== undefined) item.unitPriceSnapshot = priceOverride
  return {
    customerName: 'Test Customer',
    customerPhone: phone,
    fulfilment: 'pickup',
    collectDate: new Date(Date.now() + 86400_000).toISOString().slice(0, 10),
    collectTime: '08:00',
    notes: '',
    items: [item],
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
