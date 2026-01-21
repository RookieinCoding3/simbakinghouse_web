import type { Metadata } from 'next'
import { Bebas_Neue, Playfair_Display } from 'next/font/google'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const playfairDisplay = Playfair_Display({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Sim Baking House | Artisan Baked Goods in Penang',
  description:
    'Discover our selection of handcrafted baked goods. Order fresh pastries, cakes, and breads from Sim Baking House in Penang.',
  keywords: 'bakery, Penang, artisan bread, pastries, cakes, handcrafted, SIM BAKING HOUSE',
  authors: [{ name: 'Sim Baking House' }],
  icons: {
    icon: '/images/SBH_logo.svg',
    shortcut: '/images/SBH_logo.svg',
    apple: '/images/SBH_logo.svg',
  },
  openGraph: {
    title: 'Sim Baking House | A Space for Baking',
    description: 'Handcrafted pastries, breads, and cakes made with love and tradition in Penang',
    type: 'website',
    locale: 'en_US',
    siteName: 'Sim Baking House',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sim Baking House | Artisan Baked Goods',
    description: 'Handcrafted pastries, breads, and cakes made with love and tradition in Penang',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${playfairDisplay.variable}`}
    >
      <body className="antialiased">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
