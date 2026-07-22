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
  ...(getPublicAppUrl() ? { metadataBase: new URL(getPublicAppUrl()) } : {}),
  title: {
    default: 'Alista',
    template: '%s · Alista',
  },
  description: 'Event management platform',
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
