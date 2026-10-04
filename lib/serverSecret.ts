// A server-only signing key for small internal HMACs (the checkout
// anti-bot token, the IP hash used by rate limiting) that don't warrant
// their own dedicated secret. Reuses FIREBASE_PRIVATE_KEY rather than
// requiring a new env var: it's already required for every order to be
// written at all (see lib/firebase/admin.ts), so this needs nothing new
// configured in Vercel to work on day one, and it's never sent to the
// browser.
export function getServerSecret(): string {
  const key = process.env.FIREBASE_PRIVATE_KEY
  if (!key) {
    throw new Error('FIREBASE_PRIVATE_KEY is required (also used to derive internal signing secrets)')
  }
  return key
}
