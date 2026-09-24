import type { Metadata } from 'next'
import { Instrument_Serif, Plus_Jakarta_Sans } from 'next/font/google'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { CartProvider } from '@/lib/cart/CartContext'
import CartDrawer from '@/components/cart/CartDrawer'
import { SITE_URL, CONTACT_EMAIL, CONTACT_PHONE_E164 } from '@/lib/site'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Sim Baking House | Baking Supplies & Premix Penang | Bayan Lepas',
    template: '%s | Sim Baking House Penang',
  },
  description:
    'Your trusted baking supplies shop in Penang. Premium cake premix, bread ingredients, baking tools & accessories. Located in Bayan Lepas. Order fresh butter cake premix, German cookies, sourdough essentials. Best prices in Penang, Malaysia.',
  authors: [{ name: 'Sim Baking House', url: SITE_URL }],
  creator: 'Sim Baking House',
  publisher: 'Sim Baking House',
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_MY',
    siteName: 'Sim Baking House',
    title: 'Sim Baking House | Best Baking Supplies in Penang',
    description:
      'Premium baking supplies, cake premix & ingredients in Penang. Your one-stop baking shop in Bayan Lepas. Butter cake premix, German cookies, sourdough essentials & more.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Sim Baking House - Baking Supplies Penang',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sim Baking House | Baking Supplies Penang',
    description:
      'Premium baking supplies & cake premix in Penang. Located in Bayan Lepas. Order butter cake premix, German cookies & more.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'Shopping',
  classification: 'Baking Supplies Store',
}

// JSON-LD Structured Data for Local Business SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      '@id': `${SITE_URL}/#business`,
      name: 'Sim Baking House',
      alternateName: 'SBH Penang',
      description:
        'Premium baking supplies shop in Penang offering cake premix, baking ingredients, tools and accessories. Specializing in butter cake premix, German cookies, and sourdough essentials.',
      url: SITE_URL,
      telephone: CONTACT_PHONE_E164,
      email: CONTACT_EMAIL,
      image: `${SITE_URL}/og-image.jpg`,
      logo: `${SITE_URL}/SBH_tab.png`,
      priceRange: 'RM',
      currenciesAccepted: 'MYR',
      paymentAccepted: 'Cash, Bank Transfer, Online Payment',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Bayan Lepas',
        addressLocality: 'Penang',
        addressRegion: 'Penang',
        postalCode: '11900',
        addressCountry: 'MY',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 5.3097,
        longitude: 100.2798,
      },
      areaServed: [
        {
          '@type': 'City',
          name: 'Penang',
        },
        {
          '@type': 'State',
          name: 'Penang',
        },
      ],
      serviceArea: {
        '@type': 'GeoCircle',
        geoMidpoint: {
          '@type': 'GeoCoordinates',
          latitude: 5.3097,
          longitude: 100.2798,
        },
        geoRadius: '50000',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Baking Supplies',
        itemListElement: [
          {
            '@type': 'OfferCatalog',
            name: 'Cake Premix',
            itemListElement: [
              { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Butter Cake Premix' } },
              { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'German Cookies Premix' } },
            ],
          },
          {
            '@type': 'OfferCatalog',
            name: 'Baking Ingredients',
            itemListElement: [
              { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Bread Flour' } },
              { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Sourdough Starter' } },
            ],
          },
          {
            '@type': 'OfferCatalog',
            name: 'Baking Tools',
          },
        ],
      },
      sameAs: [
        'https://www.instagram.com/simbakinghouse',
        'https://www.facebook.com/simbakinghouse',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Sim Baking House',
      description: 'Baking supplies and premix shop in Penang, Malaysia',
      publisher: {
        '@id': `${SITE_URL}/#business`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE_URL}/#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Products',
          item: `${SITE_URL}/products`,
        },
      ],
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${plusJakartaSans.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <CartProvider>
          <Header />
          {children}
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  )
}
