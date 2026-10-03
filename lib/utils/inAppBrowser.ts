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
