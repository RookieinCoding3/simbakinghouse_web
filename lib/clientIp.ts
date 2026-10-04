import crypto from 'crypto'
import { getServerSecret } from './serverSecret'

/** First entry of x-forwarded-for is the original client — Vercel sets this
 *  at the edge, it isn't client-controllable despite the header name. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return 'unknown'
}

/** Never store a raw IP — only this HMAC, so rate-limit records in
 *  Firestore can't be reversed back into a visitor's address. */
export function hashIp(ip: string): string {
  return crypto.createHmac('sha256', getServerSecret()).update(ip).digest('hex')
}
