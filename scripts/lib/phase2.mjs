// Shared setup for the Phase 2 browser suites (emulator only — importing
// emu.mjs refuses to run outside scripts/test-env.sh).
import { randomBytes } from 'crypto'
import { BASE_URL, db, signIn, assert } from './emu.mjs'

export const opId = () => randomBytes(8).toString('hex')
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
export const getDoc = async (c, id) => (await db().collection(c).doc(id).get()).data() ?? null

/** API caller signed in as `email` (an admin created with createAdmin). */
export function apiAs(email) {
  return async function api(method, path, body) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await signIn(email)}` },
      body: body ? JSON.stringify(body) : undefined,
    })
    return { status: res.status, json: await res.json().catch(() => ({})) }
  }
}

/** Creates a product through the editor route; returns its id. */
export async function createProduct(api, body) {
  const { status, json } = await api('POST', '/api/admin/products', body)
  assert(status === 201, `create ${body.name}: ${status} ${json.error}`)
  return json.id
}

/** Counts and switches a product to managed stock in one go. */
export async function switchOn(api, productId, countedMilli) {
  const c = await api('POST', '/api/admin/stock/count', { opId: opId(), counts: [{ productId, countedMilli }] })
  assert(c.status === 200, `count: ${c.status} ${c.json.error}`)
  const m = await api('POST', '/api/admin/stock/manage', { opId: opId(), productIds: [productId], on: true, confirmOldSystemStopped: true })
  assert(m.status === 200, `switch on: ${m.status} ${m.json.error}`)
}

let seq = 0
/** Places customer orders exactly as checkout does (form token, 3 s wait).
 *  Each order gets its own phone and IP so rate limits never interfere. */
export async function placeOrders(list) {
  const tokens = await Promise.all(list.map(() => fetch(`${BASE_URL}/api/checkout/token`).then((r) => r.json())))
  await sleep(3100)
  return Promise.all(
    list.map(async (items, i) => {
      seq++
      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `192.0.2.${seq}` },
        body: JSON.stringify({
          customerName: 'Test', customerPhone: `60${String(130000000 + seq)}`, fulfilment: 'pickup',
          collectDate: new Date(Date.now() + 86400_000).toISOString().slice(0, 10), collectTime: '08:00', notes: '',
          items: items.map((it) => ({ name: 'x', ...it })), company: '',
          formIssuedAt: tokens[i].issuedAt, formToken: tokens[i].token,
        }),
      })
      return { status: res.status, json: await res.json().catch(() => ({})) }
    })
  )
}

export async function loginAdmin(page, email, password = 'test-password-123') {
  await page.goto(`${BASE_URL}/admin/login`)
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type=submit]')
  await page.waitForURL((u) => !u.pathname.startsWith('/admin/login'), { timeout: 20000 })
}

/** Polls Firestore until `test(doc)` holds (UI actions are async). */
export async function waitForDoc(c, id, test, timeout = 10000) {
  const end = Date.now() + timeout
  let last
  while (Date.now() < end) {
    last = await getDoc(c, id)
    if (last && test(last)) return last
    await sleep(200)
  }
  throw new Error(`${c}/${id} never matched: ${JSON.stringify(last)}`)
}

// WebKit reports a request that the browser itself cut off (because the test
// navigated away) as a page error "… due to access control checks". Only
// these two shapes are ignored; every other page error still fails a test:
//  - the emulators' long-poll / auth requests (127.0.0.1:8080/9099/9199)
//  - Next.js page-data requests on the app's own address (…?_rsc=…)
const APP = new URL(BASE_URL)
const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const CANCELLED_EMULATOR = /127\.0\.0\.1:(8080|9099|9199)\/.*access control checks/
const CANCELLED_RSC = new RegExp(
  `^(Fetch API cannot load )?(${escapeRe(APP.protocol)})?\\/?\\/${escapeRe(APP.host)}\\/\\S*[?&]_rsc=[\\w-]+ due to access control checks\\.$`
)
export function isCancelledRequestNoise(message) {
  return CANCELLED_EMULATOR.test(message) || CANCELLED_RSC.test(message)
}
