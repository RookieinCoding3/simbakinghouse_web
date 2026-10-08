import { test, eq, ok, done } from './harness'
import { withContentionRetry, isContention, Busy } from '../../lib/server/contention'

// The retry wrapper is async; the harness is sync, so collect results first.
const noWait = async () => {}
const lost = Object.assign(new Error('3 INVALID_ARGUMENT: Transaction is invalid or closed.'), { code: 3, details: 'Transaction is invalid or closed.' })
const aborted = Object.assign(new Error('10 ABORTED: Too much contention'), { code: 10 })
const badInput = Object.assign(new Error('3 INVALID_ARGUMENT: Value for argument "data" is not a valid Firestore document'), { code: 3 })

async function run() {
  let calls = 0
  const recovered = await withContentionRetry(async () => {
    calls++
    if (calls < 3) throw calls === 1 ? lost : aborted
    return 'ok'
  }, 4, noWait)
  const recoveredCalls = calls

  calls = 0
  let exhausted: unknown
  try {
    await withContentionRetry(async () => {
      calls++
      throw lost
    }, 4, noWait)
  } catch (e) {
    exhausted = e
  }
  const exhaustedCalls = calls

  calls = 0
  let other: unknown
  try {
    await withContentionRetry(async () => {
      calls++
      throw badInput
    }, 4, noWait)
  } catch (e) {
    other = e
  }
  const otherCalls = calls

  test('a transaction that loses a race is run again and its result returned', () => {
    eq(recovered, 'ok')
    eq(recoveredCalls, 3)
  })
  test('after 4 lost races it gives up with Busy (never a raw Firestore error)', () => {
    ok(exhausted instanceof Busy, `got ${String(exhausted)}`)
    eq(exhaustedCalls, 4)
  })
  test('any other error is rethrown at once, not retried (could have committed / is a real bug)', () => {
    eq(other, badInput)
    eq(otherCalls, 1)
  })
  test('isContention: ABORTED and the emulator\'s "invalid or closed" only', () => {
    eq([isContention(aborted), isContention(lost), isContention(badInput), isContention(new Error('x')), isContention(null)], [true, true, false, false, false])
  })
  done()
}

void run()
