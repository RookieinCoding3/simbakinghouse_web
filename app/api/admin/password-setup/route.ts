import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { getServerSecret } from '@/lib/serverSecret'
import { getClientIp, hashIp } from '@/lib/clientIp'
import { hitRateLimit } from '@/lib/server/rateLimit'
import { lookupUserByEmail, sendPasswordSetupEmail } from '@/lib/server/identityToolkit'
import { formatRetryAfter } from '@/lib/orderRateLimit'

export const runtime = 'nodejs'

const GENERIC =
  'If this email belongs to an admin account, a link to set a password is on its way. Open it, choose a password, then come back here and sign in with email and password.'

/**
 * "Set a password" for an admin whose account only has Google sign-in
 * (e.g. Sim on an installed iPhone app, where the Google pop-up is
 * unreliable). Sends Firebase's own password-reset email, which adds a
 * password to that same account — never creates a new one — and only for
 * an email whose account has an admins/{uid} doc. The answer is identical
 * either way, so this can't be used to find out which emails are admins.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { email?: unknown } | null
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    const emailKey = crypto.createHmac('sha256', getServerSecret()).update(`pwsetup:${email}`).digest('hex')
    for (const [key, max] of [
      [`pwsetup_ip_${hashIp(getClientIp(request))}`, 5],
      [`pwsetup_email_${emailKey}`, 3],
    ] as const) {
      const limit = await hitRateLimit(key, max, 60 * 60 * 1000)
      if (!limit.ok) {
        return NextResponse.json(
          { error: `Too many requests. Try again in ${formatRetryAfter(limit.retryAfterMs)}.` },
          { status: 429 }
        )
      }
    }

    const user = await lookupUserByEmail(email)
    if (user && !user.disabled) {
      const adminDoc = await getAdminDb().collection('admins').doc(user.uid).get()
      if (adminDoc.exists) await sendPasswordSetupEmail(email)
    }
    return NextResponse.json({ ok: true, message: GENERIC })
  } catch (error) {
    console.error('[admin/password-setup] failed:', error)
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
  }
}
