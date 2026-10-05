import { getAdminDb } from '@/lib/firebase/admin'

// Generic fixed-window counter in Firestore (same approach as
// lib/orderRateLimit.ts: shared across serverless instances, checked and
// incremented in one transaction). Doc ids are caller-chosen keys — never
// put raw personal data in them; hash phones/IPs/emails first.
export async function hitRateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<{ ok: true } | { ok: false; retryAfterMs: number }> {
  const db = getAdminDb()
  const ref = db.collection('rateLimits').doc(key)
  const now = Date.now()
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.data() as { count?: number; windowStart?: number } | undefined
    const fresh = !data?.windowStart || now - data.windowStart >= windowMs
    const count = fresh ? 0 : data!.count ?? 0
    const windowStart = fresh ? now : data!.windowStart!
    if (count + 1 > max) return { ok: false as const, retryAfterMs: windowStart + windowMs - now }
    tx.set(ref, { count: count + 1, windowStart })
    return { ok: true as const }
  })
}
