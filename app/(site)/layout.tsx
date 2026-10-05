import type { Metadata, Viewport } from 'next'
import { Instrument_Serif, Plus_Jakarta_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { CartProvider } from '@/lib/cart/CartContext'
import CartDrawer from '@/components/cart/CartDrawer'
import AppCheckInit from '@/components/AppCheckInit'
import PWAInit from '@/components/PWAInit'
import { SITE_URL, CONTACT_EMAIL, CONTACT_PHONE_E164 } from '@/lib/site'
import '../globals.css'

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
  // Plain string, not a {default, template} object: a template would get
  // re-applied on top of each page's own already-complete title (set via
  // lib/seo.ts's pageMetadata()), producing "Page | Sim Baking House | Sim
  // Baking House Penang" — found live on /privacy and /terms. Every page
  // now owns its full, final title string instead.
  title: 'Sim Baking House | Baking Supplies & Premix, Penang',
  description:
    'Baking supplies shop in Bayan Lepas, Penang. Cake premix, ingredients, tools & accessories, fresh stock, best prices. Order easily on WhatsApp.',
  applicationName: 'Sim Baking House',
  manifest: '/manifest.webmanifest',
  authors: [{ name: 'Sim Baking House', url: SITE_URL }],
  creator: 'Sim Baking House',
  publisher: 'Sim Baking House',
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
  // Favicon/app icons come entirely from the App Router file conventions
  // (app/favicon.ico, app/icon.png, app/apple-icon.png) — Next detects
  // these automatically, emits the right <link> tags, and appends its own
  // content-hash query string to each (e.g. /icon.png?<hash>), which is
  // what actually busts a browser's old cached icon on every rebuild: a
  // stronger, self-maintaining version of a manual ?v=2 that updates
  // itself whenever the file changes instead of needing to be bumped by
  // hand. The web manifest is handled the same way via app/manifest.ts.
  //
  // TODO: add token when Search Console access is available
  // verification: { google: '' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sim Baking House',
  },
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

export const viewport: Viewport = {
  themeColor: '#7A4031', // tailwind.config.ts `clay` — the brand's primary accent
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
      logo: `${SITE_URL}/icon-512.png`,
      priceRange: 'RM',
      currenciesAccepted: 'MYR',
      paymentAccepted: 'Cash, Bank Transfer, Online Payment',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Tingkat Sungai Ara 1, Sungai Ara',
        addressLocality: 'Bayan Lepas',
        addressRegion: 'Pulau Pinang',
        postalCode: '11900',
        addressCountry: 'MY',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 5.3097,
        longitude: 100.2798,
      },
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '06:30',
        closes: '13:00',
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
      // Must match components/layout/Footer.tsx's links exactly — these
      // were previously generic/guessed handles that didn't match the
      // real profiles linked in the footer (sim_baking_house, not
      // simbakinghouse) - wrong sameAs data actively misleads Google
      // about which accounts belong to this business.
      sameAs: [
        'https://www.instagram.com/sim_baking_house/',
        'https://www.facebook.com/p/Sim-Baking-House-100057442848182/',
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
        <AppCheckInit />
        <PWAInit />
        <AuthProvider>
          <CartProvider>
            <Header />
            {children}
            <Footer />
            <CartDrawer />
          </CartProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
