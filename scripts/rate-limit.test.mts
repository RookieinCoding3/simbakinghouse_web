// Order rate-limit counters against the Firestore emulator (no server):
// recording attempts, and refunding one when the order then couldn't be
// written. Run inside scripts/test-env.sh (refuses to run otherwise).
import { checkAndRecordOrderAttempt, refundOrderAttempt, RateLimitExceeded } from '../lib/orderRateLimit'
import { getAdminDb } from '../lib/firebase/admin'

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.startsWith('demo-')) {
  throw new Error('Refusing to run outside the emulator')
}

let passed = 0
let failed = 0
async function check(name: string, run: () => Promise<void>) {
  try {
    await run()
    console.log(`PASS  ${name}`)
    passed++
  } catch (e) {
    console.log(`FAIL  ${name}`)
    console.log(`      ${String((e as Error).message).split('\n')[0]}`)
    failed++
  }
}
function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg)
}

const db = getAdminDb()
const counts = async (phone: string, ipHash: string) => {
  const [p, i, g] = await Promise.all([
    db.collection('rateLimits').doc(`phone_${phone}`).get(),
    db.collection('rateLimits').doc(`ip_${ipHash}`).get(),
    db.collection('rateLimits').doc('global').get(),
  ])
  return { phoneHour: p.data()?.hour?.count, phoneDay: p.data()?.day?.count, ipHour: i.data()?.hour?.count, ipDay: i.data()?.day?.count, global: g.data()?.window?.count }
}

await check('refunding one attempt gives back exactly one slot on every counter it used', async () => {
  const a = { phone: '60111000001', ipHash: 'refund-ip-1' }
  await checkAndRecordOrderAttempt(a)
  await checkAndRecordOrderAttempt(a)
  const receipt = await checkAndRecordOrderAttempt(a)
  const before = await counts(a.phone, a.ipHash)
  await refundOrderAttempt(receipt)
  const after = await counts(a.phone, a.ipHash)
  assert(before.phoneHour === 3 && after.phoneHour === 2 && after.phoneDay === 2, JSON.stringify({ before, after }))
  assert(after.ipHour === before.ipHour! - 1 && after.ipDay === before.ipDay! - 1, JSON.stringify({ before, after }))
  assert(after.global === before.global! - 1, JSON.stringify({ before, after }))
})

await check('after a refund the customer can order again (the slot really is free)', async () => {
  const a = { phone: '60111000001', ipHash: 'refund-ip-1' }
  await checkAndRecordOrderAttempt(a) // back to 3
  let blocked = false
  try {
    await checkAndRecordOrderAttempt(a)
  } catch (e) {
    blocked = e instanceof RateLimitExceeded
  }
  assert(blocked, '4th attempt was not blocked')
})

await check('a refund for a window that has since rolled over changes nothing; counts never go below 0', async () => {
  const a = { phone: '60111000002', ipHash: 'refund-ip-2' }
  const receipt = await checkAndRecordOrderAttempt(a)
  const stale = { ...receipt, starts: { ...receipt.starts, phoneHour: receipt.starts.phoneHour - 3_600_000 } }
  await refundOrderAttempt(stale)
  let c = await counts(a.phone, a.ipHash)
  assert(c.phoneHour === 1 && c.phoneDay === 0, `stale hour refunded or day not: ${JSON.stringify(c)}`)
  await refundOrderAttempt(receipt)
  await refundOrderAttempt(receipt)
  c = await counts(a.phone, a.ipHash)
  assert(c.phoneHour === 0 && c.phoneDay === 0 && c.ipHour === 0, `went wrong / below 0: ${JSON.stringify(c)}`)
})

await check('30 simultaneous attempts for one phone: exactly 3 recorded, the rest blocked or Busy, never a raw error', async () => {
  const a = { phone: '60111000003', ipHash: 'burst-ip' }
  const outcomes = await Promise.all(
    Array.from({ length: 30 }, () =>
      checkAndRecordOrderAttempt(a).then(
        () => 'recorded',
        (e) => (e instanceof RateLimitExceeded ? 'limited' : e?.constructor?.name === 'Busy' ? 'busy' : `ERROR ${e?.code} ${e?.message}`)
      )
    )
  )
  const tally = outcomes.reduce<Record<string, number>>((m, o) => ({ ...m, [o]: (m[o] ?? 0) + 1 }), {})
  console.log(`      outcomes: ${JSON.stringify(tally)}`)
  assert(tally.recorded === 3, `recorded ${tally.recorded}`)
  assert(outcomes.every((o) => o === 'recorded' || o === 'limited' || o === 'busy'), `raw errors: ${outcomes.filter((o) => o.startsWith('ERROR'))}`)
  const c = await counts(a.phone, a.ipHash)
  assert(c.phoneHour === 3 && c.ipHour === 3, `counters ${JSON.stringify(c)} (double-counted or leaked)`)
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
