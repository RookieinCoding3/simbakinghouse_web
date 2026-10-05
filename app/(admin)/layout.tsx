import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { AdminSessionProvider } from '@/lib/admin/AdminSession'
import '../globals.css'

// The admin's own root layout: none of the customer site's Header, Footer,
// cart, auth modal, analytics, App Check or service-worker registration
// load here (see app/(site)/layout.tsx for those).
const sans = Plus_Jakarta_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SBH Admin',
  applicationName: 'SBH Admin',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  manifest: '/admin/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'SBH Admin', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  themeColor: '#1F1D1B',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      {/* Headings use the same sans as body text in admin — one font file, app-like. */}
      <body className="antialiased bg-paper text-ink" style={{ ['--font-heading' as string]: 'var(--font-body)' }}>
        <AdminSessionProvider>{children}</AdminSessionProvider>
      </body>
    </html>
  )
}
