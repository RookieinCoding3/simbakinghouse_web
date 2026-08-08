import type { Metadata } from 'next'
import { Bebas_Neue, Playfair_Display } from 'next/font/google'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { CONTACT_PHONE_E164 } from '@/lib/config/contact'
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
  metadataBase: new URL('https://www.simbakinghouse.com.my'),
  title: {
    default: 'Sim Baking House | Baking Supplies & Premix Penang | Bayan Lepas',
    template: '%s | Sim Baking House Penang',
  },
  description:
    'Your trusted baking supplies shop in Penang. Premium cake premix, bread ingredients, baking tools & accessories. Located in Bayan Lepas. Order fresh butter cake premix, German cookies, sourdough essentials. Best prices in Penang, Malaysia.',
  authors: [{ name: 'Sim Baking House', url: 'https://www.simbakinghouse.com.my' }],
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
    url: 'https://www.simbakinghouse.com.my',
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
  alternates: {
    canonical: 'https://www.simbakinghouse.com.my',
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
      '@id': 'https://www.simbakinghouse.com.my/#business',
      name: 'Sim Baking House',
      alternateName: 'SBH Penang',
      description:
        'Premium baking supplies shop in Penang offering cake premix, baking ingredients, tools and accessories. Specializing in butter cake premix, German cookies, and sourdough essentials.',
      url: 'https://www.simbakinghouse.com.my',
      telephone: CONTACT_PHONE_E164,
      email: 'simbakinghouse25@gmail.com',
      image: 'https://www.simbakinghouse.com.my/og-image.jpg',
      logo: 'https://www.simbakinghouse.com.my/SBH_tab.png',
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
      '@id': 'https://www.simbakinghouse.com.my/#website',
      url: 'https://www.simbakinghouse.com.my',
      name: 'Sim Baking House',
      description: 'Baking supplies and premix shop in Penang, Malaysia',
      publisher: {
        '@id': 'https://www.simbakinghouse.com.my/#business',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://www.simbakinghouse.com.my/products?search={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://www.simbakinghouse.com.my/#breadcrumb',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.simbakinghouse.com.my',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Products',
          item: 'https://www.simbakinghouse.com.my/products',
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
      className={`${bebasNeue.variable} ${playfairDisplay.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
