// Proves the one specific claim in question after the 2026-10-03 guest
// checkout incident: a missing/absent Authorization header must resolve to
// a guest order (userId: null), and must NEVER throw. This is exactly the
// function app/api/orders/route.ts calls before touching Firestore at all.
//
// Run with: node scripts/guest-checkout.test.mjs
import { verifyFirebaseIdToken } from '../lib/firebase/verifyIdToken.ts'

let passed = 0
let failed = 0

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

await check('no Authorization header (null token) resolves to guest (null), does not throw', async () => {
  const result = await verifyFirebaseIdToken(null)
  if (result !== null) throw new Error(`expected null, got ${JSON.stringify(result)}`)
})

await check('empty string token resolves to guest (null), does not throw', async () => {
  const result = await verifyFirebaseIdToken('')
  if (result !== null) throw new Error(`expected null, got ${JSON.stringify(result)}`)
})

await check('garbage/malformed token resolves to guest (null), does not throw', async () => {
  const result = await verifyFirebaseIdToken('not-a-real-jwt')
  if (result !== null) throw new Error(`expected null, got ${JSON.stringify(result)}`)
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
