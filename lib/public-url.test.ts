import { describe, expect, it } from 'vitest'

import { resolvePaymentAppUrl } from './public-url'

describe('resolvePaymentAppUrl', () => {
  it('uses Vercel’s deployment URL for Preview callbacks', () => {
    expect(
      resolvePaymentAppUrl({
        publicAppUrl: 'https://alista.com.ar',
        vercelEnvironment: 'preview',
        vercelUrl: 'alista-preview-abc.vercel.app',
      })
    ).toBe('https://alista-preview-abc.vercel.app')
  })

  it('keeps the canonical URL in production', () => {
    expect(
      resolvePaymentAppUrl({
        publicAppUrl: 'https://alista.com.ar/',
        vercelEnvironment: 'production',
        vercelUrl: 'alista-preview-abc.vercel.app',
      })
    ).toBe('https://alista.com.ar')
  })

  it('fails closed when no callback URL is configured', () => {
    expect(resolvePaymentAppUrl({ vercelEnvironment: 'production' })).toBe('')
  })
})
