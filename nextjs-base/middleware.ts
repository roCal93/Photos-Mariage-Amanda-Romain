import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { locales, defaultLocale } from './src/lib/locales'

export const runtime = 'edge'

function normalizeOrigin(input: string): string | null {
  try {
    return new URL(input).origin
  } catch {
    return null
  }
}

/** Replicate the allowed-origins logic so frame-ancestors stays accurate. */
function getAllowedFrameAncestors(): string[] {
  const allowedEnv =
    process.env.ALLOWED_ORIGINS ?? process.env.NEXT_PUBLIC_ALLOWED_ORIGINS
  const strapiOrigin =
    process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337'
  const origins = new Set<string>()

  if (allowedEnv) {
    allowedEnv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((u) => {
        const origin = normalizeOrigin(u)
        if (origin) origins.add(origin)
      })
  } else {
    const origin = normalizeOrigin(strapiOrigin)
    if (origin) origins.add(origin)
  }

  const siteOrigin = normalizeOrigin(
    process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      'http://localhost:3000'
  )
  if (siteOrigin) origins.add(siteOrigin)

  return Array.from(origins)
}

/**
 * Build a per-request CSP header.
 * Uses a nonce so 'unsafe-inline' is no longer required for scripts.
 */
function buildCsp(nonce: string): string {
  const strapiOrigin =
    process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337'
  const normalizedStrapiOrigin = normalizeOrigin(strapiOrigin) || strapiOrigin
  const isProd = process.env.NODE_ENV === 'production'
  const frameAncestors = ["'self'", ...getAllowedFrameAncestors()].join(' ')

  const directives = [
    "default-src 'self';",
    `img-src 'self' data: https://res.cloudinary.com ${normalizedStrapiOrigin};`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isProd ? '' : " 'unsafe-eval'"};`,
    "style-src 'self' 'unsafe-inline';",
    "style-src-attr 'unsafe-inline';",
    "frame-src 'self' https://vercel.live;",
    `connect-src 'self' ${normalizedStrapiOrigin};`,
    "font-src 'self' data:;",
    "object-src 'none';",
    "base-uri 'self';",
    "form-action 'self';",
    'upgrade-insecure-requests;',
    `frame-ancestors ${frameAncestors};`,
  ]

  return directives
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl

    const isReservationPath =
      pathname === '/reservation-page' || pathname.endsWith('/reservation-page')
    if (req.method === 'GET' && isReservationPath) {
      const sensitiveParams = [
        'firstName',
        'lastName',
        'email',
        'phone',
        'message',
        'website',
        'consent',
      ]
      const cleanedUrl = req.nextUrl.clone()
      let removed = false
      for (const key of sensitiveParams) {
        if (cleanedUrl.searchParams.has(key)) {
          cleanedUrl.searchParams.delete(key)
          removed = true
        }
      }
      if (removed) {
        return NextResponse.redirect(cleanedUrl)
      }
    }

    const isRscOrPrefetchRequest =
      req.headers.get('rsc') === '1' ||
      req.headers.has('next-router-prefetch') ||
      req.headers.get('accept')?.includes('text/x-component')

    // Ignore static assets, API and other non-page requests
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/static') ||
      pathname.includes('.')
    ) {
      return NextResponse.next()
    }

    // Generate a per-request nonce
    const nonce = btoa(crypto.randomUUID())
    const csp = buildCsp(nonce)
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-nonce', nonce)

    const segments = pathname.split('/').filter(Boolean)
    const first = segments[0]
    const locale =
      first && (locales as readonly string[]).includes(first)
        ? first
        : defaultLocale

    // Only redirect when there is NO locale segment at all ("/").
    // If the first segment exists but is not a supported locale (e.g. "/f"),
    // we let the request through so the app can render a proper 404.
    if (!first) {
      const url = req.nextUrl.clone()
      url.pathname = `/${locale}${url.pathname}`

      const redirectRes = NextResponse.redirect(url)
      try {
        redirectRes.cookies.set({
          name: 'locale',
          value: locale,
          path: '/',
          sameSite: 'lax',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 30,
        })
      } catch {
        const cookieValue = `locale=${encodeURIComponent(locale)}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${process.env.NODE_ENV === 'production' ? '; Secure; HttpOnly' : ''}`
        redirectRes.headers.set('set-cookie', cookieValue)
      }

      redirectRes.headers.set('Content-Security-Policy', csp)

      return redirectRes
    }

    // If the first segment exists but is not a supported locale, do not rewrite/redirect.
    if (!(locales as readonly string[]).includes(first)) {
      const res = NextResponse.next({ request: { headers: requestHeaders } })
      res.headers.set('Content-Security-Policy', csp)
      return res
    }

    const res = NextResponse.next({ request: { headers: requestHeaders } })
    res.headers.set('Content-Security-Policy', csp)

    // Avoid mutating cookies on RSC/prefetch requests used by App Router soft navigation.
    if (isRscOrPrefetchRequest) {
      return res
    }

    const currentLocaleCookie = req.cookies.get('locale')?.value
    if (currentLocaleCookie === locale) {
      return res
    }

    try {
      // Prefer the Cookies API when available (sets HttpOnly cookie)
      res.cookies.set({
        name: 'locale',
        value: locale,
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
      })
    } catch {
      // Fallback to setting header
      const cookieValue = `locale=${encodeURIComponent(locale)}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${process.env.NODE_ENV === 'production' ? '; Secure; HttpOnly' : ''}`
      res.headers.set('set-cookie', cookieValue)
    }

    return res
  } catch {
    return NextResponse.next()
  }
}

// Match all non-api and non-_next routes
export const config = {
  matcher: ['/((?!_next|api/|static).*)'],
}
