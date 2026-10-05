'use client'

// Route-segment error boundary: a page that throws while rendering shows
// this instead of taking down the whole app — the admin shell (top bar,
// bottom tabs, sign out) stays fully usable around it.
export default function AdminPageError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="text-center py-16 space-y-4">
      <p className="text-sm text-ink">Could not load this page.</p>
      <button onClick={reset} className="bg-ink text-paper text-xs uppercase tracking-widest px-5 py-3">
        Retry
      </button>
    </div>
  )
}
