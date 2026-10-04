import { NextResponse } from 'next/server'
import { signCheckoutToken } from '@/lib/checkoutToken'

export const runtime = 'nodejs'

/**
 * The checkout page calls this once, on mount, and echoes the result back
 * unchanged in the order POST. See lib/checkoutToken.ts for why — it's
 * what lets app/api/orders check "was this form open for at least 3
 * seconds" against the server's own clock, not the client's.
 */
export async function GET() {
  const issuedAt = Date.now()
  const token = signCheckoutToken(issuedAt)
  return NextResponse.json({ issuedAt, token })
}
