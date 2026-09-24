// Malaysian mobile numbers, normalised to the 60XXXXXXXXX form used
// throughout orders (Firestore, wa.me links, the Phase 5 Firestore rule
// this mirrors: ^60[0-9]{8,10}$).

const MY_PHONE_PATTERN = /^60[0-9]{8,10}$/

/**
 * Accepts common local input shapes — "012-345 6789", "0123456789",
 * "+60123456789", "60123456789" — and returns the normalised 60XXXXXXXXX
 * form, or null if it isn't a plausible Malaysian mobile number.
 */
export function normalizeMyPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return null

  let normalized: string
  if (raw.trim().startsWith('+60')) {
    normalized = digits // '+' already stripped by the digits-only replace
  } else if (digits.startsWith('60')) {
    normalized = digits
  } else if (digits.startsWith('0')) {
    normalized = `60${digits.slice(1)}`
  } else {
    return null
  }

  return MY_PHONE_PATTERN.test(normalized) ? normalized : null
}

export function lastFourDigits(phone: string): string {
  return phone.slice(-4)
}
