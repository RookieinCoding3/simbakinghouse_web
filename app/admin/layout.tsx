import type { Metadata } from 'next'

// Covers /admin/login and everything under (protected)/* (dashboard,
// orders, products, settings) in one place — route groups don't add a URL
// segment, so this layout sits above both without changing any path.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
