import type { Metadata } from 'next'

// Covers /order/[orderId] (a Client Component, which can't export metadata
// directly) — one order's status page, gated by phone last-4, has no
// business being indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
