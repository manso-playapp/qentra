import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { getPublicAppUrl } from '@/lib/public-url'
import './globals.css'

const nunito = localFont({
  src: './fonts/Nunito-Variable-Latin.woff2',
  display: 'swap',
  variable: '--font-nunito',
  weight: '200 1000',
  style: 'normal',
})

const interTight = localFont({
  src: './fonts/InterTight-Variable-Latin.woff2',
  display: 'swap',
  variable: '--font-inter-tight',
  weight: '100 900',
  style: 'normal',
})

const playfairDisplay = localFont({
  src: './fonts/PlayfairDisplay-Regular.ttf',
  display: 'swap',
  variable: '--font-playfair',
  weight: '400',
  style: 'normal',
})

export const metadata: Metadata = {
  applicationName: 'Alista',
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  ...(getPublicAppUrl() ? { metadataBase: new URL(getPublicAppUrl()) } : {}),
  title: {
    default: 'Alista | Tus 15 empiezan mucho antes',
    template: '%s | Alista',
  },
  description:
    'Invitaciones, confirmaciones, grupos, entradas y accesos. Todo preparado en un solo lugar para tus 15.',
  category: 'Cumpleaños de 15',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`${nunito.variable} ${interTight.variable} ${playfairDisplay.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
