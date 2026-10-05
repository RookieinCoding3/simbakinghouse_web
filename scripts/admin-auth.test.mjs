// Admin sign-in paths, against the Auth + Firestore emulators:
// Google sign-in (via the emulator's real pop-up), and "Set a password" for
// a Google-only admin account. Run inside scripts/test-env.sh.
import { chromium } from 'playwright'
import {
  BASE_URL, db, resetEmulators, createGoogleUser, emailedCodes, completePasswordReset, providersOf,
  check, assert, summary,
} from './lib/emu.mjs'

await resetEmulators()
const SIM = 'sim.sbh@gmail.test'
const PASSWORD = 'Kuih-Lapis-2026'
const otherGoogle = await createGoogleUser('just.a.customer@gmail.test')

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
let simUid = null

async function googleSignIn(email, { existing }) {
  await page.goto(`${BASE_URL}/admin/login`)
  const [popup] = await Promise.all([page.waitForEvent('popup'), page.getByRole('button', { name: 'Sign in with Google' }).click()])
  await popup.waitForLoadState('domcontentloaded')
  // The emulator lists accounts that currently have a Google link; right after a
  // password reset Sim's isn't listed (the reset drops the link until the next
  // Google sign-in re-adds it), so sign in by email the way a real chooser would.
  await popup.waitForTimeout(500)
  if (existing && (await popup.getByText(email).count())) {
    await popup.getByText(email).first().click()
  } else {
    await popup.getByText('Add new account').click()
    await popup.fill('#email-input', email)
    await popup.getByText('Sign in with Google.com').click()
  }
  await popup.waitForEvent('close', { timeout: 15000 }).catch(() => {})
}
async function passwordSignIn(email, password) {
  await page.goto(`${BASE_URL}/admin/login`)
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type=submit]')
}
async function requestPasswordLink(email) {
  await page.goto(`${BASE_URL}/admin/login`)
  await page.getByRole('button', { name: 'Only used Google before? Set a password' }).click()
  await page.fill('#setup-email', email)
  await page.getByRole('button', { name: 'Email me a link' }).click()
  await page.getByTestId('setup-message').or(page.locator('p.text-clay')).first().waitFor({ timeout: 15000 })
  return (await page.getByTestId('setup-message').count()) ? await page.getByTestId('setup-message').innerText() : null
}

console.log('--- Google sign-in ---')

await check('a new Google account that is not an admin is turned away with its UID', async () => {
  await googleSignIn(SIM, { existing: false })
  await page.getByText('This account is not an admin.').waitFor({ timeout: 15000 })
  simUid = (await page.getByTestId('rejected-uid').innerText()).trim()
  assert(simUid.length > 10, 'no uid shown')
})

await check('once admins/{uid} exists, Google sign-in goes straight to /admin', async () => {
  await db().collection('admins').doc(simUid).set({ role: 'owner' })
  await googleSignIn(SIM, { existing: true })
  await page.waitForURL(`${BASE_URL}/admin`, { timeout: 15000 })
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.waitForURL(/\/admin\/login/, { timeout: 15000 })
})

console.log('\n--- Set a password (Google-only admin) ---')

await check('before: the Google-only account has no password, so email sign-in fails', async () => {
  assert(JSON.stringify(await providersOf(simUid)) === JSON.stringify(['google.com']), `providers: ${await providersOf(simUid)}`)
  await passwordSignIn(SIM, PASSWORD)
  await page.getByText('Wrong email or password.').waitFor({ timeout: 15000 })
})

let adminMessage = ''
await check('"Set a password" for the admin email: generic message, and Firebase emails a reset link', async () => {
  adminMessage = (await requestPasswordLink(SIM)) || ''
  assert(/If this email belongs to an admin account/.test(adminMessage), `message: ${adminMessage}`)
  const codes = (await emailedCodes(SIM)).filter((c) => c.requestType === 'PASSWORD_RESET')
  assert(codes.length === 1, `expected 1 reset email, got ${codes.length}`)
})

await check('a Google account that is NOT an admin gets the identical message, and no email', async () => {
  const msg = await requestPasswordLink(otherGoogle.email)
  assert(msg === adminMessage, 'message differs — would reveal who is an admin')
  assert((await emailedCodes(otherGoogle.email)).length === 0, 'an email was sent to a non-admin')
})

await check('an unknown email gets the identical message, and no email', async () => {
  const msg = await requestPasswordLink('nobody@nowhere.test')
  assert(msg === adminMessage, 'message differs')
  assert((await emailedCodes('nobody@nowhere.test')).length === 0, 'an email was sent')
})

await check('after following the link: email + password signs in to the SAME admin account', async () => {
  const [code] = (await emailedCodes(SIM)).filter((c) => c.requestType === 'PASSWORD_RESET')
  await completePasswordReset(code.oobCode, PASSWORD)
  await passwordSignIn(SIM, PASSWORD)
  await page.waitForURL(`${BASE_URL}/admin`, { timeout: 15000 })
  const uid = await page.evaluate(() => JSON.parse(localStorage.getItem('sbh-admin-verdict') || '{}').uid)
  assert(uid === simUid, `signed in as ${uid}, expected the original ${simUid} (a new account was created?)`)
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.waitForURL(/\/admin\/login/, { timeout: 15000 })
})

await check('Google sign-in still works afterwards, same account; both methods now linked', async () => {
  await googleSignIn(SIM, { existing: true })
  await page.waitForURL(`${BASE_URL}/admin`, { timeout: 15000 })
  const uid = await page.evaluate(() => JSON.parse(localStorage.getItem('sbh-admin-verdict') || '{}').uid)
  assert(uid === simUid, 'different account')
  const providers = await providersOf(simUid)
  assert(JSON.stringify(providers) === JSON.stringify(['google.com', 'password']), `providers: ${providers}`)
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.waitForURL(/\/admin\/login/, { timeout: 15000 })
})

await check('the account count did not grow (no duplicate account for Sim)', async () => {
  const res = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/accounts:query`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' }, body: JSON.stringify({}),
  })
  const { userInfo = [] } = await res.json()
  const sims = userInfo.filter((u) => u.email === SIM)
  assert(sims.length === 1, `${sims.length} accounts with Sim's email`)
})

await check('repeated requests for one email are rate-limited (3 per hour)', async () => {
  for (let i = 0; i < 2; i++) await requestPasswordLink(SIM) // 1 used above -> 3 total
  await requestPasswordLink(SIM)
  assert(await page.getByText(/Too many requests/).count(), 'no rate-limit message on the 4th request')
})

await browser.close()
process.exit(summary() > 0 ? 1 : 0)
