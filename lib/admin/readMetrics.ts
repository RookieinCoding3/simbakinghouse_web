// Test-only Firestore read counter (scripts/admin-perf.mjs reads
// window.__fsReads). A no-op unless NEXT_PUBLIC_FS_METRICS=1 was set at
// build time, which only the perf harness does.
export function recordReads(n: number) {
  if (process.env.NEXT_PUBLIC_FS_METRICS !== '1' || typeof window === 'undefined') return
  const w = window as unknown as { __fsReads?: number }
  // Firestore bills a query that returns nothing as one read.
  w.__fsReads = (w.__fsReads ?? 0) + Math.max(1, n)
}
