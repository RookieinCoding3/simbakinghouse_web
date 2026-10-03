/**
 * Detects known in-app browsers (WhatsApp, Instagram, Facebook) via user
 * agent. Google blocks OAuth sign-in inside embedded WebViews like these
 * ("This browser or app may not be secure") — this is used to hide the
 * Google button and point people to their real browser instead, rather
 * than let them hit that error.
 *
 * Known limitation: this is UA sniffing, so it's reliable on Android
 * (these apps' WebViews add an identifiable token) but weaker on iOS,
 * where WhatsApp/Messenger's in-app browser is a WKWebView that doesn't
 * always add a distinguishing marker. There's no fully reliable way to
 * detect an iOS in-app browser from the page itself — this covers the
 * cases that are actually detectable, not every case.
 */
export interface InAppBrowserInfo {
  isInApp: boolean
  appName: string | null
}

export function detectInAppBrowser(userAgent: string): InAppBrowserInfo {
  if (/\bFBAN\b|\bFBAV\b|FB_IAB/i.test(userAgent)) return { isInApp: true, appName: 'Facebook' }
  if (/Instagram/i.test(userAgent)) return { isInApp: true, appName: 'Instagram' }
  if (/\bWhatsApp\b/i.test(userAgent)) return { isInApp: true, appName: 'WhatsApp' }
  return { isInApp: false, appName: null }
}

/**
 * Defense in depth for the case detectInAppBrowser() above misses (mainly
 * iOS, where these apps' in-app browsers often don't add a distinguishing
 * UA token at all): Google's own OAuth consent screen refuses to load
 * inside a WebView it recognizes as embedded, returning
 * "Error 403: disallowed_useragent". That shows up to signInWithPopup as
 * a generic popup failure, but the underlying OAuth error string survives
 * on the error object — check for it so this case gets the same
 * "open in a real browser" message even when the proactive check didn't
 * catch it.
 */
export function isBlockedUserAgentError(error: unknown): boolean {
  const message = [
    (error as { message?: string })?.message,
    (error as { customData?: { _tokenResponse?: { error?: { message?: string } } } })?.customData
      ?._tokenResponse?.error?.message,
  ]
    .filter(Boolean)
    .join(' ')
  return /disallowed_useragent/i.test(message)
}
