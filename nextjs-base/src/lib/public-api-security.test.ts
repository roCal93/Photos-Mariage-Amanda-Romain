import { afterEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { enforcePublicApiOrigin } from './public-api-security'

const OLD_ORIGINS = process.env.PUBLIC_API_ALLOWED_ORIGINS

afterEach(() => {
  process.env.PUBLIC_API_ALLOWED_ORIGINS = OLD_ORIGINS
})

function makeRequest(
  headers: Record<string, string> = {},
  url = 'https://app.example.com/api/contact'
) {
  return new NextRequest(url, { headers })
}

describe('enforcePublicApiOrigin', () => {
  it('allows request with no origin and no referer (server-to-server)', () => {
    const req = makeRequest()
    expect(enforcePublicApiOrigin(req)).toBeNull()
  })

  it('allows request whose origin matches the request host', () => {
    const req = makeRequest({ origin: 'https://app.example.com' })
    expect(enforcePublicApiOrigin(req)).toBeNull()
  })

  it('blocks request from an unknown origin', () => {
    const req = makeRequest({ origin: 'https://evil.com' })
    const res = enforcePublicApiOrigin(req)
    expect(res?.status).toBe(403)
  })

  it('allows request from origin listed in PUBLIC_API_ALLOWED_ORIGINS', () => {
    process.env.PUBLIC_API_ALLOWED_ORIGINS = 'https://trusted.com'
    const req = makeRequest({ origin: 'https://trusted.com' })
    expect(enforcePublicApiOrigin(req)).toBeNull()
  })

  it('allows multiple extra origins separated by comma', () => {
    process.env.PUBLIC_API_ALLOWED_ORIGINS =
      'https://trusted.com,https://other.com'
    expect(
      enforcePublicApiOrigin(makeRequest({ origin: 'https://trusted.com' }))
    ).toBeNull()
    expect(
      enforcePublicApiOrigin(makeRequest({ origin: 'https://other.com' }))
    ).toBeNull()
  })

  it('allows request with referer from same origin', () => {
    const req = makeRequest({ referer: 'https://app.example.com/page' })
    expect(enforcePublicApiOrigin(req)).toBeNull()
  })

  it('blocks request with referer from unknown origin', () => {
    const req = makeRequest({ referer: 'https://evil.com/page' })
    const res = enforcePublicApiOrigin(req)
    expect(res?.status).toBe(403)
  })

  it('blocks request with a malformed referer URL', () => {
    const req = makeRequest({ referer: 'not-a-valid-url' })
    const res = enforcePublicApiOrigin(req)
    expect(res?.status).toBe(403)
  })

  it('strips trailing slash from allowed origins before comparing', () => {
    process.env.PUBLIC_API_ALLOWED_ORIGINS = 'https://trusted.com/'
    const req = makeRequest({ origin: 'https://trusted.com' })
    expect(enforcePublicApiOrigin(req)).toBeNull()
  })
})
