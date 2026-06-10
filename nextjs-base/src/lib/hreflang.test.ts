import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getHreflangAlternates } from './hreflang'

const OLD_ENV = process.env.NEXT_PUBLIC_SITE_URL

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
})

afterEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = OLD_ENV
})

describe('getHreflangAlternates', () => {
  it('builds one entry per locale when no localizations provided', () => {
    const { languages } = getHreflangAlternates('about')
    expect(languages['fr']).toBe('https://example.com/fr/about')
    expect(languages['en']).toBe('https://example.com/en/about')
    expect(languages['it']).toBe('https://example.com/it/about')
  })

  it('treats "home" slug as empty path (fallback)', () => {
    const { languages } = getHreflangAlternates('home')
    expect(languages['fr']).toBe('https://example.com/fr')
    expect(languages['en']).toBe('https://example.com/en')
  })

  it('uses provided localizations and ignores unlisted locales', () => {
    const { languages } = getHreflangAlternates('about', [
      { locale: 'en', slug: 'about' },
      { locale: 'fr', slug: 'a-propos' },
    ])
    expect(languages['en']).toBe('https://example.com/en/about')
    expect(languages['fr']).toBe('https://example.com/fr/a-propos')
    expect(languages['it']).toBeUndefined()
  })

  it('treats "home" slug as empty path in localizations', () => {
    const { languages } = getHreflangAlternates('home', [
      { locale: 'fr', slug: 'home' },
      { locale: 'en', slug: 'home' },
    ])
    expect(languages['fr']).toBe('https://example.com/fr')
    expect(languages['en']).toBe('https://example.com/en')
  })

  it('adds x-default pointing to default locale (fr)', () => {
    const { languages } = getHreflangAlternates('about')
    expect(languages['x-default']).toBe('https://example.com/fr/about')
  })

  it('x-default uses empty path for home slug', () => {
    const { languages } = getHreflangAlternates('home')
    expect(languages['x-default']).toBe('https://example.com/fr')
  })

  it('falls back to localhost when NEXT_PUBLIC_SITE_URL is not set', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    const { languages } = getHreflangAlternates('about')
    expect(languages['fr']).toBe('http://localhost:3000/fr/about')
  })

  it('strips trailing slash from NEXT_PUBLIC_SITE_URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com/'
    const { languages } = getHreflangAlternates('about')
    expect(languages['fr']).toBe('https://example.com/fr/about')
  })
})
