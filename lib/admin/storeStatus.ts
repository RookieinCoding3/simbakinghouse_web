/** "6:30 AM" → minutes after midnight (null if unreadable). */
export function displayTimeToMinutes(display: string): number | null {
  const m = display.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!m) return null
  let h = Number(m[1]) % 12
  if (m[3].toUpperCase() === 'PM') h += 12
  return h * 60 + Number(m[2])
}

/** Open / closed right now in Kuala Lumpur, for the admin status pill. */
export function storeStatus(opensAt: string, closesAt: string, now = Date.now()): { open: boolean; label: string } {
  const open = displayTimeToMinutes(opensAt)
  const close = displayTimeToMinutes(closesAt)
  const kl = new Date(now + 8 * 3600_000)
  const mins = kl.getUTCHours() * 60 + kl.getUTCMinutes()
  if (open === null || close === null) return { open: false, label: 'Hours not set' }
  return mins >= open && mins < close ? { open: true, label: `Open until ${closesAt}` } : { open: false, label: `Closed · opens ${opensAt}` }
}
