// Users & roles: API route access matrix, guards, audit entries, and the
// Users page per role. Run inside scripts/test-env.sh.
import { chromium } from 'playwright'
import { BASE_URL, db, resetEmulators, createAdmin, createUser, signIn, check, assert, summary } from './lib/emu.mjs'

await resetEmulators()
const kin = await createAdmin('kin@sbh.test', 'admin')
const sim = await createAdmin('sim@sbh.test', 'owner')
const legacy = await createAdmin('legacy@sbh.test') // no role field
const customer = await createUser('customer@sbh.test')
const helper = await createUser('helper@sbh.test')

const tokens = {
  admin: () => signIn(kin.email),
  owner: () => signIn(sim.email),
  legacy: () => signIn(legacy.email),
  customer: () => signIn(customer.email),
}
async function api(who, method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  if (who) headers.Authorization = `Bearer ${await (typeof who === 'function' ? who() : tokens[who]())}`
  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  return { status: res.status, json: await res.json().catch(() => ({})) }
}
const auditCount = async () => (await db().collection('auditLog').get()).size
const roleIn = async (uid) => (await db().collection('admins').doc(uid).get()).data()?.role ?? null

console.log('--- Who can use the Users routes ---')

for (const [who, expected] of [[null, 401], ['customer', 403], ['owner', 403], ['legacy', 403], ['admin', 200]]) {
  await check(`GET /api/admin/users as ${who ?? 'signed-out'} → ${expected}`, async () => {
    const { status } = await api(who, 'GET', '/api/admin/users')
    assert(status === expected, `got ${status}`)
  })
}

await check('owner cannot add, change or remove users (403), and nothing is logged', async () => {
  const before = await auditCount()
  const add = await api('owner', 'POST', '/api/admin/users', { email: helper.email, role: 'owner' })
  const patch = await api('owner', 'PATCH', `/api/admin/users/${kin.uid}`, { role: 'owner' })
  const del = await api('owner', 'DELETE', `/api/admin/users/${legacy.uid}`)
  assert([add.status, patch.status, del.status].every((s) => s === 403), `${add.status}/${patch.status}/${del.status}`)
  assert((await auditCount()) === before, 'audit entry written for a refused request')
})

console.log('\n--- Listing and adding ---')

await check('admin lists everyone with email, sign-in methods and role (no-role doc shown as owner)', async () => {
  const { json } = await api('admin', 'GET', '/api/admin/users')
  const byEmail = Object.fromEntries(json.users.map((u) => [u.email, u]))
  assert(byEmail[kin.email]?.role === 'admin' && byEmail[kin.email].isYou, 'kin wrong')
  assert(byEmail[sim.email]?.role === 'owner', 'sim wrong')
  assert(byEmail[legacy.email]?.role === 'owner' && byEmail[legacy.email].roleIsImplicit, 'legacy wrong')
  assert(byEmail[sim.email].signInMethods.includes('password'), 'sign-in methods missing')
})

await check('adding an email with no Firebase account says so (404), nothing written', async () => {
  const before = await auditCount()
  const { status, json } = await api('admin', 'POST', '/api/admin/users', { email: 'nobody@sbh.test', role: 'owner' })
  assert(status === 404 && /No account uses nobody@sbh.test/.test(json.error), `${status} ${json.error}`)
  assert((await auditCount()) === before, 'audit written')
})

await check('adding an existing account as owner works, and is audited', async () => {
  const before = await auditCount()
  const { status } = await api('admin', 'POST', '/api/admin/users', { email: helper.email, role: 'owner' })
  assert(status === 201, `got ${status}`)
  assert((await roleIn(helper.uid)) === 'owner', 'doc not created')
  const entries = await db().collection('auditLog').where('action', '==', 'user.add').get()
  const e = entries.docs.map((d) => d.data()).find((d) => d.entityId === helper.uid)
  assert(e && e.byUid === kin.uid && e.byEmail === kin.email && e.after.role === 'owner', JSON.stringify(e))
  assert((await auditCount()) === before + 1, 'not exactly one audit entry')
})

await check('adding the same person twice is refused (409)', async () => {
  const { status } = await api('admin', 'POST', '/api/admin/users', { email: helper.email, role: 'admin' })
  assert(status === 409, `got ${status}`)
})

console.log('\n--- Guards ---')

await check('the last admin cannot demote themselves (409), and no audit entry is left', async () => {
  const before = await auditCount()
  const { status, json } = await api('admin', 'PATCH', `/api/admin/users/${kin.uid}`, { role: 'owner' })
  assert(status === 409 && /last admin/.test(json.error), `${status} ${json.error}`)
  assert((await roleIn(kin.uid)) === 'admin', 'kin was demoted anyway')
  assert((await auditCount()) === before, 'failed change left an audit entry')
})

await check('nobody can remove themselves (400)', async () => {
  const { status } = await api('admin', 'DELETE', `/api/admin/users/${kin.uid}`)
  assert(status === 400, `got ${status}`)
  assert((await roleIn(kin.uid)) === 'admin', 'kin removed')
})

await check('promote and demote are audited with before/after', async () => {
  const before = await auditCount()
  assert((await api('admin', 'PATCH', `/api/admin/users/${helper.uid}`, { role: 'admin' })).status === 200, 'promote failed')
  assert((await api('admin', 'PATCH', `/api/admin/users/${helper.uid}`, { role: 'owner' })).status === 200, 'demote failed')
  assert((await auditCount()) === before + 2, 'expected 2 entries')
  const entries = (await db().collection('auditLog').where('entityId', '==', helper.uid).where('action', '==', 'user.role').get()).docs.map((d) => d.data())
  assert(entries.some((e) => e.before.role === 'owner' && e.after.role === 'admin'), 'promote entry wrong')
})

await check('two admins demoting each other at the same moment: exactly one succeeds', async () => {
  await api('admin', 'PATCH', `/api/admin/users/${sim.uid}`, { role: 'admin' }) // now kin + sim are admins
  const [a, b] = await Promise.all([
    api('admin', 'PATCH', `/api/admin/users/${sim.uid}`, { role: 'owner' }),
    api('owner', 'PATCH', `/api/admin/users/${kin.uid}`, { role: 'owner' }), // sim, currently admin
  ])
  const oks = [a, b].filter((r) => r.status === 200).length
  const admins = (await db().collection('admins').get()).docs.filter((d) => d.data().role === 'admin').length
  assert(oks === 1, `${oks} succeeded (${a.status}, ${b.status})`)
  assert(admins === 1, `${admins} admins left`)
})

await check('a demoted admin loses access to the Users routes immediately', async () => {
  const kinIsAdmin = (await roleIn(kin.uid)) === 'admin'
  const demoted = kinIsAdmin ? sim : kin
  const { status } = await api(() => signIn(demoted.email), 'GET', '/api/admin/users')
  assert(status === 403, `got ${status}`)
  // restore: kin admin, sim owner
  const current = kinIsAdmin ? 'admin' : () => signIn(sim.email)
  if (!kinIsAdmin) await api(current, 'PATCH', `/api/admin/users/${kin.uid}`, { role: 'admin' })
  await api('admin', 'PATCH', `/api/admin/users/${sim.uid}`, { role: 'owner' })
  assert((await roleIn(kin.uid)) === 'admin' && (await roleIn(sim.uid)) === 'owner', 'restore failed')
})

await check('removing a user deletes only their admins doc (their account stays) and is audited', async () => {
  const before = await auditCount()
  assert((await api('admin', 'DELETE', `/api/admin/users/${helper.uid}`)).status === 200, 'remove failed')
  assert((await roleIn(helper.uid)) === null, 'doc still there')
  await signIn(helper.email) // account still signs in
  assert((await auditCount()) === before + 1, 'not audited')
})

console.log('\n--- Users page ---')

const browser = await chromium.launch()
async function pageAs(user) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  await page.goto(`${BASE_URL}/admin/login`)
  await page.fill('#email', user.email)
  await page.fill('#password', user.password)
  await page.click('button[type=submit]')
  await page.waitForURL(`${BASE_URL}/admin`, { timeout: 15000 })
  return page
}

await check('admin: sees the Users link, the list, and can add someone from the page', async () => {
  const page = await pageAs(kin)
  try {
  await page.getByRole('link', { name: 'Users' }).click()
  await page.getByTestId('user-list').waitFor({ timeout: 15000 })
  assert(await page.getByText(sim.email).count(), 'sim not listed')
  await page.fill('#add-email', helper.email)
  await page.getByRole('button', { name: 'Add user' }).click()
  await page.getByText(`${helper.email} was added as an owner.`).waitFor({ timeout: 15000 })
  await page.fill('#add-email', 'ghost@sbh.test')
  await page.getByRole('button', { name: 'Add user' }).click()
  await page.getByText(/No account uses ghost@sbh.test/).waitFor({ timeout: 15000 })
  } catch (e) {
    await page.screenshot({ path: '/tmp/sbh-users-fail.png', fullPage: true })
    throw e
  } finally {
    await page.context().close()
  }
})

await check('owner: no Users link, and /admin/users explains only an admin can manage users', async () => {
  const page = await pageAs(sim)
  assert(!(await page.getByRole('link', { name: 'Users' }).count()), 'owner sees Users link')
  await page.goto(`${BASE_URL}/admin/users`)
  await page.getByText('Only an admin can manage users.').waitFor({ timeout: 15000 })
  await page.context().close()
})

await browser.close()
process.exit(summary() > 0 ? 1 : 0)
