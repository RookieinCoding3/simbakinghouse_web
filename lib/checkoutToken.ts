import crypto from 'crypto'
import { getServerSecret } from './serverSecret'

/**
 * Proves a checkout submission's elapsed fill time without trusting the
 * client's own clock: GET /api/checkout/token hands out {issuedAt, token}
 * when the checkout page mounts, the client echoes both back unchanged on
 * submit, and the server recomputes the elapsed time itself from its own
 * clock and this signature — a client can't forge an earlier issuedAt
 * (the HMAC would no longer match) or claim a longer wait than actually
 * happened (the server's own Date.now() is what's compared, not anything
 * the client reports).
 */
export function signCheckoutToken(issuedAt: number): string {
  return crypto.createHmac('sha256', getServerSecret()).update(`checkout:${issuedAt}`).digest('hex')
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
}

export function verifyCheckoutToken(token: unknown, issuedAt: unknown): issuedAt is number {
  if (typeof token !== 'string' || typeof issuedAt !== 'number' || !Number.isFinite(issuedAt)) {
    return false
  }
  try {
    return timingSafeEqualHex(signCheckoutToken(issuedAt), token)
  } catch {
    return false
  }
}
