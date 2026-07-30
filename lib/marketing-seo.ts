import type { Metadata } from 'next'

type MarketingMetadataInput = {
  title: string
  description: string
  path: string
}

/** Shared metadata for public, indexable marketing pages. */
export function createMarketingMetadata({
  title,
  description,
  path,
}: MarketingMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | Alista`,
      description,
      url: path,
      type: 'website',
      locale: 'es_AR',
      siteName: 'Alista',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Alista`,
      description,
    },
  }
}
