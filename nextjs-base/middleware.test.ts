import { afterEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from './middleware'

const OLD_NODE_ENV = process.env.NODE_ENV

afterEach(() => {
  process.env.NODE_ENV = OLD_NODE_ENV
  delete process.env.NEXT_PUBLIC_STRAPI_URL
  delete process.env.NEXT_PUBLIC_SITE_URL
})

function req(
  url: string,
  options: { headers?: Record<string, string>; cookie?: string } = {}
) {
  const headers: Record<string, string> = { ...options.headers }
  if (options.cookie) headers['cookie'] = options.cookie
  return new NextRequest(url, { headers })
}

// ─── Sensitive params ────────────────────────────────────────────────────────

describe('sensitive param stripping on /reservation-page', () => {
  it('redirects and removes PII query params', () => {
    const res = middleware(
      req('https://example.com/reservation-page?firstName=John&email=a@b.com')
    )
    expect(res.status).toBeGreaterThanOrEqual(300)
    const location = res.headers.get('location') ?? ''
    expect(location).not.toContain('firstName')
    expect(location).not.toContain('email')
  })

  it('does not redirect when no sensitive params present', () => {
    const res = middleware(req('https://example.com/reservation-page?tab=1'))
    // no sensitive-param redirect — falls through to locale logic (unknown path, passes through)
    expect(res.headers.get('location')).toBeNull()
  })
})

// ─── Static assets passthrough ───────────────────────────────────────────────

describe('static assets and API passthrough', () => {
  it('passes through _next requests', () => {
    const res = middleware(req('https://example.com/_next/static/chunk.js'))
    expect(res.headers.get('location')).toBeNull()
    expect(res.status).toBe(200)
  })

  it('passes through files with an extension', () => {
    const res = middleware(req('https://example.com/favicon.ico'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('passes through /api/ routes', () => {
    const res = middleware(req('https://example.com/api/contact'))
    expect(res.headers.get('location')).toBeNull()
  })
})

// ─── Locale redirect ─────────────────────────────────────────────────────────

describe('locale redirect', () => {
  it('redirects / to /fr (default locale)', () => {
    const res = middleware(req('https://example.com/'))
    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.headers.get('location')).toContain('/fr')
  })

  it('sets locale cookie on root redirect', () => {
    const res = middleware(req('https://example.com/'))
    expect(res.headers.get('set-cookie')).toContain('locale=fr')
  })

  it('does not redirect an unknown first segment (lets 404 render)', () => {
    const res = middleware(req('https://example.com/unknown-path'))
    expect(res.headers.get('location')).toBeNull()
  })
})

// ─── Locale cookie management ─────────────────────────────────────────────────

describe('locale cookie on locale-prefixed paths', () => {
  it('sets locale cookie when visiting /fr/page without existing cookie', () => {
    const res = middleware(req('https://example.com/fr/about'))
    expect(res.headers.get('set-cookie')).toContain('locale=fr')
  })

  it('sets locale=en cookie when visiting /en/ path', () => {
    const res = middleware(req('https://example.com/en/about'))
    expect(res.headers.get('set-cookie')).toContain('locale=en')
  })

  it('does not set cookie when locale cookie already matches', () => {
    const res = middleware(
      req('https://example.com/fr/about', { cookie: 'locale=fr' })
    )
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('does not set cookie on RSC request (rsc: 1 header)', () => {
    const res = middleware(
      req('https://example.com/fr/about', { headers: { rsc: '1' } })
    )
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('does not set cookie on prefetch request', () => {
    const res = middleware(
      req('https://example.com/fr/about', {
        headers: { 'next-router-prefetch': '1' },
      })
    )
    expect(res.headers.get('set-cookie')).toBeNull()
  })
})

// ─── CSP header ──────────────────────────────────────────────────────────────

describe('Content-Security-Policy header', () => {
  it('is set on locale-prefixed page responses', () => {
    const res = middleware(req('https://example.com/fr/about'))
    expect(res.headers.get('content-security-policy')).toBeTruthy()
  })

  it('contains a nonce', () => {
    const res = middleware(req('https://example.com/fr/about'))
    expect(res.headers.get('content-security-policy')).toContain("'nonce-")
  })

  it('is set on locale redirect responses', () => {
    const res = middleware(req('https://example.com/'))
    expect(res.headers.get('content-security-policy')).toBeTruthy()
  })

  it('includes unsafe-eval in dev and omits it in prod', () => {
    process.env.NODE_ENV = 'development'
    const devRes = middleware(req('https://example.com/fr/about'))
    expect(devRes.headers.get('content-security-policy')).toContain(
      "'unsafe-eval'"
    )

    process.env.NODE_ENV = 'production'
    const prodRes = middleware(req('https://example.com/fr/about'))
    expect(prodRes.headers.get('content-security-policy')).not.toContain(
      "'unsafe-eval'"
    )
  })
})
