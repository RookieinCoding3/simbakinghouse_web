// The shop runs on Malaysian time. Anything that means "which day" (today's
// sales, same-day void, reports) uses Asia/Kuala_Lumpur, never UTC — at
// 11 pm in Penang it's still the same day, even though it's 3 pm UTC.
export const SHOP_TZ = 'Asia/Kuala_Lumpur'

/** "YYYY-MM-DD" for the given instant, in Malaysian time. */
export function klDateKey(at: Date | number = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: SHOP_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    typeof at === 'number' ? new Date(at) : at
  )
}

export function formatKlDateTime(at: Date | number): string {
  return new Date(at).toLocaleString('en-MY', { timeZone: SHOP_TZ, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

export function formatKlTime(at: Date | number): string {
  return new Date(at).toLocaleTimeString('en-MY', { timeZone: SHOP_TZ, hour: 'numeric', minute: '2-digit' })
}
