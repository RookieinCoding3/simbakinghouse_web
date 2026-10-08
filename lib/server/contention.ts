// Firestore transactions on a busy document (the order rate-limit counters,
// the order number counter) can lose a race with each other. The Admin SDK
// retries ABORTED itself, but after its own attempts it gives up, and the
// emulator reports a lost lock as INVALID_ARGUMENT "Transaction is invalid or
// closed" which the SDK never retries. Either way the transaction did NOT
// commit, so running it again is safe. Anything else (including errors where
// the commit outcome is unknown) is rethrown untouched.

export class Busy extends Error {
  constructor() {
    super('too much contention')
  }
}

export function isContention(error: unknown): boolean {
  const e = error as { code?: unknown; details?: unknown; message?: unknown }
  if (e?.code === 10) return true // ABORTED
  const text = `${typeof e?.details === 'string' ? e.details : ''} ${typeof e?.message === 'string' ? e.message : ''}`
  return e?.code === 3 && /Transaction is invalid or closed/.test(text)
}

/** Runs `fn` (a whole Firestore transaction) again after a short random wait
 *  when it lost a race; throws Busy after `attempts` tries. */
export async function withContentionRetry<T>(fn: () => Promise<T>, attempts = 4, wait = defaultWait): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (!isContention(error)) throw error
      if (attempt >= attempts) throw new Busy()
      await wait(attempt)
    }
  }
}

function defaultWait(attempt: number): Promise<void> {
  // 25–100 ms, 50–200 ms, 100–400 ms: spreads the retries out.
  const base = 25 * 2 ** (attempt - 1)
  return new Promise((r) => setTimeout(r, base + Math.random() * base * 3))
}
