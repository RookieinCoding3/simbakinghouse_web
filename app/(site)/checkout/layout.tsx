import type { Metadata } from 'next'

// app/checkout/page.tsx is a Client Component ('use client'), which can't
// export metadata directly — this Server Component layout carries it instead.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
