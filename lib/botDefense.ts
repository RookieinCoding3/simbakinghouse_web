export const MIN_FILL_TIME_MS = 3_000

/** A hidden "company" field real users never see or tab to — a bot that
 *  fills every field it finds trips this. */
export function isHoneypotTripped(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function isSubmittedTooFast(issuedAt: number, now: number): boolean {
  return now - issuedAt < MIN_FILL_TIME_MS
}
