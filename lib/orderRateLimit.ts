import { getAdminDb } from './firebase/admin'
import { withContentionRetry } from './server/contention'

// Firestore-backed, not in-memory: a serverless function's memory resets
// on every cold start and isn't shared across concurrent instances, so an
// in-memory counter only ever rate-limits "this one warm instance,
// right now" — easy to blow through by nothing more than bad luck in
// which instance handles each request. A counter document per key, updated
// inside a transaction, is the same limit no matter which instance reads it.
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export const PHONE_LIMITS = { hour: 3, day: 8 }
export const IP_LIMITS = { hour: 10, day: 30 }
// Unchanged from the old in-memory version — a burst cap across every
// order regardless of who's placing it, not specific to one phone or IP.
export const GLOBAL_WINDOW_MS = 60_000
export const GLOBAL_MAX = 60

interface WindowState {
  count: number
  windowStart: number
}

function freshOrCurrent(state: WindowState | undefined, now: number, windowMs: number): WindowState {
  if (!state || now - state.windowStart >= windowMs) {
    return { count: 0, windowStart: now }
  }
  return state
}

export class RateLimitExceeded extends Error {
  scope: 'phone' | 'ip' | 'global'
  retryAfterMs: number
  constructor(scope: 'phone' | 'ip' | 'global', retryAfterMs: number) {
    super(`rate limit exceeded: ${scope}`)
    this.scope = scope
    this.retryAfterMs = retryAfterMs
  }
}

/**
 * Atomically checks every limit (phone hour/day, IP hour/day, global burst)
 * and, only if all of them still have room, records this attempt against
 * all of them — one Firestore transaction, so a request can't be counted
 * against some keys but not others, and two concurrent requests can't both
 * slip through a limit that only has one slot left.
 *
 * Throws RateLimitExceeded (not swallowed) when any limit is hit, naming
 * which one and how long until it has room again — callers map that to a
 * 429 with a human-readable retry time. Throws Busy (lib/server/contention)
 * if the transaction keeps losing races with other orders; nothing was
 * recorded in that case. Any other error (e.g. a genuine Firestore outage)
 * propagates as-is to the caller's own error handling.
 */
/** Which counter windows an attempt was recorded in, so it can be undone. */
export interface AttemptReceipt {
  phone: string
  ipHash: string
  starts: { phoneHour: number; phoneDay: number; ipHour: number; ipDay: number; global: number }
}

export async function checkAndRecordOrderAttempt(opts: { phone: string; ipHash: string }): Promise<AttemptReceipt> {
  const db = getAdminDb()
  const phoneRef = db.collection('rateLimits').doc(`phone_${opts.phone}`)
  const ipRef = db.collection('rateLimits').doc(`ip_${opts.ipHash}`)
  const globalRef = db.collection('rateLimits').doc('global')

  // Every order touches the same "global" counter, so a burst of orders can
  // make these transactions lose races: retried (it never committed), and
  // after a few tries the caller gets Busy and answers "try again shortly".
  return withContentionRetry(() => db.runTransaction(async (tx): Promise<AttemptReceipt> => {
    const now = Date.now()
    const [phoneSnap, ipSnap, globalSnap] = await Promise.all([
      tx.get(phoneRef),
      tx.get(ipRef),
      tx.get(globalRef),
    ])
    const phoneData = (phoneSnap.data() as { hour?: WindowState; day?: WindowState }) || {}
    const ipData = (ipSnap.data() as { hour?: WindowState; day?: WindowState }) || {}
    const globalData = (globalSnap.data() as { window?: WindowState }) || {}

    const phoneHour = freshOrCurrent(phoneData.hour, now, HOUR_MS)
    const phoneDay = freshOrCurrent(phoneData.day, now, DAY_MS)
    const ipHour = freshOrCurrent(ipData.hour, now, HOUR_MS)
    const ipDay = freshOrCurrent(ipData.day, now, DAY_MS)
    const global = freshOrCurrent(globalData.window, now, GLOBAL_WINDOW_MS)

    if (phoneHour.count + 1 > PHONE_LIMITS.hour) {
      throw new RateLimitExceeded('phone', phoneHour.windowStart + HOUR_MS - now)
    }
    if (phoneDay.count + 1 > PHONE_LIMITS.day) {
      throw new RateLimitExceeded('phone', phoneDay.windowStart + DAY_MS - now)
    }
    if (ipHour.count + 1 > IP_LIMITS.hour) {
      throw new RateLimitExceeded('ip', ipHour.windowStart + HOUR_MS - now)
    }
    if (ipDay.count + 1 > IP_LIMITS.day) {
      throw new RateLimitExceeded('ip', ipDay.windowStart + DAY_MS - now)
    }
    if (global.count + 1 > GLOBAL_MAX) {
      throw new RateLimitExceeded('global', global.windowStart + GLOBAL_WINDOW_MS - now)
    }

    tx.set(phoneRef, {
      hour: { count: phoneHour.count + 1, windowStart: phoneHour.windowStart },
      day: { count: phoneDay.count + 1, windowStart: phoneDay.windowStart },
    })
    tx.set(ipRef, {
      hour: { count: ipHour.count + 1, windowStart: ipHour.windowStart },
      day: { count: ipDay.count + 1, windowStart: ipDay.windowStart },
    })
    tx.set(globalRef, {
      window: { count: global.count + 1, windowStart: global.windowStart },
    })
    return {
      phone: opts.phone,
      ipHash: opts.ipHash,
      starts: { phoneHour: phoneHour.windowStart, phoneDay: phoneDay.windowStart, ipHour: ipHour.windowStart, ipDay: ipDay.windowStart, global: global.windowStart },
    }
  }))
}

/**
 * Undoes one recorded attempt, for when the order itself then could not be
 * written (Busy): the customer was told to try again, so that attempt must
 * not use up one of their slots. Only decrements a window that is still the
 * one the attempt was recorded in (a window that has since rolled over
 * already forgot it). Best effort: if this fails too, one slot stays used.
 */
export async function refundOrderAttempt(receipt: AttemptReceipt): Promise<void> {
  const db = getAdminDb()
  const phoneRef = db.collection('rateLimits').doc(`phone_${receipt.phone}`)
  const ipRef = db.collection('rateLimits').doc(`ip_${receipt.ipHash}`)
  const globalRef = db.collection('rateLimits').doc('global')
  const dec = (w: WindowState | undefined, start: number) =>
    w && w.windowStart === start && w.count > 0 ? { count: w.count - 1, windowStart: w.windowStart } : w
  await withContentionRetry(() => db.runTransaction(async (tx) => {
    const [p, i, g] = await Promise.all([tx.get(phoneRef), tx.get(ipRef), tx.get(globalRef)])
    const pd = (p.data() as { hour?: WindowState; day?: WindowState }) || {}
    const id = (i.data() as { hour?: WindowState; day?: WindowState }) || {}
    const gd = (g.data() as { window?: WindowState }) || {}
    if (p.exists) tx.set(phoneRef, { hour: dec(pd.hour, receipt.starts.phoneHour), day: dec(pd.day, receipt.starts.phoneDay) })
    if (i.exists) tx.set(ipRef, { hour: dec(id.hour, receipt.starts.ipHour), day: dec(id.day, receipt.starts.ipDay) })
    if (g.exists) tx.set(globalRef, { window: dec(gd.window, receipt.starts.global) })
  }))
}

export function formatRetryAfter(retryAfterMs: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterMs / 60_000))
  if (minutes < 60) return `about ${minutes} minute${minutes === 1 ? '' : 's'}`
  const hours = Math.ceil(minutes / 60)
  return `about ${hours} hour${hours === 1 ? '' : 's'}`
}
