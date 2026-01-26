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
  metadataBase: new URL('https://simbakinghouse.com'),
  title: {
    default: 'Sim Baking House | Baking Supplies & Premix Penang | Bayan Lepas',
    template: '%s | Sim Baking House Penang',
  },
  description:
    'Your trusted baking supplies shop in Penang. Premium cake premix, bread ingredients, baking tools & accessories. Located in Bayan Lepas. Order fresh butter cake premix, German cookies, sourdough essentials. Best prices in Penang, Malaysia.',
  keywords: [
    // Primary keywords
    'baking supplies Penang',
    'baking shop Penang',
    'baking ingredients Penang',
    'cake premix Penang',
    'baking tools Penang',
    // Location-specific
    'Bayan Lepas bakery supplies',
    'baking store Bayan Lepas',
    'Penang baking shop',
    'bakery ingredients Penang Malaysia',
    // Product-specific
    'butter cake premix Malaysia',
    'German cookies premix',
    'sourdough starter Penang',
    'bread flour Penang',
    'cake decorating supplies Penang',
    'baking equipment Malaysia',
    // Intent-based
    'where to buy baking supplies Penang',
    'best baking shop near me Penang',
    'halal baking ingredients Penang',
    'home baking supplies Malaysia',
    'professional baking tools Penang',
    // Brand
    'Sim Baking House',
    'SBH Penang',
  ],
  authors: [{ name: 'Sim Baking House', url: 'https://simbakinghouse.com' }],
  creator: 'Sim Baking House',
  publisher: 'Sim Baking House',
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  icons: {
    icon: '/SBH_tab.png',
    shortcut: '/SBH_tab.png',
    apple: '/SBH_tab.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_MY',
    url: 'https://simbakinghouse.com',
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
    canonical: 'https://simbakinghouse.com',
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
      '@id': 'https://simbakinghouse.com/#business',
      name: 'Sim Baking House',
      alternateName: 'SBH Penang',
      description:
        'Premium baking supplies shop in Penang offering cake premix, baking ingredients, tools and accessories. Specializing in butter cake premix, German cookies, and sourdough essentials.',
      url: 'https://simbakinghouse.com',
      telephone: '+60-12-401-9334',
      email: 'simbakinghouse25@gmail.com',
      image: 'https://simbakinghouse.com/og-image.jpg',
      logo: 'https://simbakinghouse.com/SBH_tab.png',
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
      '@id': 'https://simbakinghouse.com/#website',
      url: 'https://simbakinghouse.com',
      name: 'Sim Baking House',
      description: 'Baking supplies and premix shop in Penang, Malaysia',
      publisher: {
        '@id': 'https://simbakinghouse.com/#business',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://simbakinghouse.com/products?search={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://simbakinghouse.com/#breadcrumb',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://simbakinghouse.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Products',
          item: 'https://simbakinghouse.com/products',
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
