import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import { getPublicAppUrl } from '@/lib/public-url'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito',
})

export const metadata: Metadata = {
  applicationName: 'Alista',
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  ...(getPublicAppUrl() ? { metadataBase: new URL(getPublicAppUrl()) } : {}),
  title: {
    default: 'Alista | Gesti\u00f3n de invitados para eventos',
    template: '%s | Alista',
  },
  description: 'Gesti\u00f3n de invitados, pagos, accesos y cupo para eventos privados.',
  category: 'Event management',
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
    <html lang="es" className={`${nunito.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
