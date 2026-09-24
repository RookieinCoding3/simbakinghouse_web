import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'

// Implements the retention promise in /privacy: orders older than 12
// months are deleted. TASK.md Phase 5.5 asks for "a scheduled Cloud
// Function (or a documented manual step)" — this is a Next.js API route
// instead, so it needs no new infrastructure (no firebase-functions
// dependency, no separate deploy target), reusing the Admin SDK already
// in this project. It still needs *something* to call it on a schedule:
//
//   - On Vercel: vercel.json in the repo root already schedules this
//     daily via Vercel Cron. Nothing further to do once deployed there.
//   - Anywhere else: call this URL on a schedule via any external cron
//     service (e.g. cron-job.org, GitHub Actions on a schedule, a
//     server crontab hitting curl), or run it by hand occasionally —
//     that's the "documented manual step" the spec allows as the
//     alternative to a Cloud Function.
//
// Either way, set CRON_SECRET and call with
// `Authorization: Bearer <CRON_SECRET>` — without it this is a public
// endpoint that deletes data, which must never be reachable by anyone
// who merely guesses the URL.
export const runtime = 'nodejs'

const RETENTION_DAYS = 365
const BATCH_SIZE = 400 // Firestore batch writes cap at 500; leaves headroom

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getAdminDb()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)
    const cutoffIso = cutoff.toISOString()

    let totalDeleted = 0
    // Loop in case there are more than BATCH_SIZE eligible orders — each
    // pass deletes what it finds and re-queries, since a delete removes
    // matching docs from the next query's result set.
    for (;;) {
      const snap = await db
        .collection('orders')
        .where('createdAt', '<', cutoffIso)
        .limit(BATCH_SIZE)
        .get()

      if (snap.empty) break

      const batch = db.batch()
      snap.docs.forEach((doc) => batch.delete(doc.ref))
      await batch.commit()
      totalDeleted += snap.size

      if (snap.size < BATCH_SIZE) break
    }

    return NextResponse.json({ deleted: totalDeleted, cutoff: cutoffIso })
  } catch (error) {
    console.error('[cron/cleanup-orders] failed:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
