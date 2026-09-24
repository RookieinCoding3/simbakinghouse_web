import { initializeAppCheck, ReCaptchaV3Provider, getToken, type AppCheck } from 'firebase/app-check'
import app from './config'

// Client-only, and deliberately optional: if NEXT_PUBLIC_RECAPTCHA_SITE_KEY
// isn't set, every function here is a no-op rather than throwing, so the
// site keeps working exactly as before until App Check is actually set up.
// See TASK.md Phase 5.3 for the manual setup steps (Firebase Console >
// App Check > register a reCAPTCHA v3 site key, then enforce it for
// Firestore/Storage — both Console-only actions, no code equivalent).
const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

let appCheck: AppCheck | null = null

export function initAppCheck(): void {
  if (typeof window === 'undefined' || !SITE_KEY || appCheck) return
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    })
  } catch (error) {
    console.error('[app-check] failed to initialize:', error)
  }
}

/**
 * A fresh App Check token to attach to a fetch() call the Admin SDK should
 * verify server-side (e.g. app/api/orders — see requireAppCheck in
 * lib/firebase/admin.ts). Returns null when App Check isn't configured, or
 * the browser couldn't get a token — callers should degrade gracefully,
 * not block the request, since App Check is additive defense, not the
 * only thing standing between a spammer and /api/orders (rate limiting
 * and full server-side validation run regardless).
 */
export async function getAppCheckToken(): Promise<string | null> {
  if (!appCheck) return null
  try {
    const result = await getToken(appCheck, false)
    return result.token
  } catch {
    return null
  }
}
