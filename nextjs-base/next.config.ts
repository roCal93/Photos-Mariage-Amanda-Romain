import type { NextConfig } from 'next'

function normalizeOrigin(input: string): string | null {
  try {
    return new URL(input).origin
  } catch {
    return null
  }
}

function getSiteOrigin(): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    'http://localhost:3000'
  return normalizeOrigin(siteUrl) || 'http://localhost:3000'
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'traduction-amanda-production.up.railway.app',
        pathname: '/uploads/**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development', // Activer l'optimisation en production
    formats: ['image/webp', 'image/avif'], // Formats modernes pour réduire la taille
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 85], // Qualités d'images autorisées
  },

  // Optimisations de performance
  compress: true, // Activer la compression Gzip/Brotli
  poweredByHeader: false, // Supprimer l'en-tête X-Powered-By

  // For Turbopack: explicitly set workspace root to this Next app to avoid
  // module resolution issues when the repo contains multiple lockfiles.
  // See https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory
  turbopack: {
    root: __dirname,
  } as const,

  // Autoriser l'admin Strapi à intégrer le site en iframe pour la Preview
  async headers() {
    const siteOrigin = getSiteOrigin()
    const isProd = process.env.NODE_ENV === 'production'

    // Note: Content-Security-Policy (avec nonce par requête) est géré dans middleware.ts
    // pour remplacer 'unsafe-inline' par 'nonce-{nonce}' + 'strict-dynamic'.
    const securityHeaders: { key: string; value: string }[] = [
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'geolocation=(), microphone=(), camera=()',
      },
      {
        key: 'Cross-Origin-Resource-Policy',
        value: 'same-origin',
      },
      {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin',
      },
    ]

    if (isProd) {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      })
    }

    return [
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: siteOrigin,
          },
          {
            key: 'Vary',
            value: 'Origin',
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: siteOrigin,
          },
          {
            key: 'Vary',
            value: 'Origin',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
