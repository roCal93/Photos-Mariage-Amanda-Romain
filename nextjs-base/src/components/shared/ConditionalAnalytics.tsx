'use client'

/**
 * ConditionalAnalytics
 *
 * Activates analytics scripts only after the user accepts cookies,
 * by listening to the 'cookie-consent-accepted' DOM event.
 *
 * Usage in layout.tsx:
 *   import ConditionalAnalytics from '@/components/shared/ConditionalAnalytics'
 *   // Replace any hard-coded <Analytics /> with:
 *   <ConditionalAnalytics />
 *
 * To add Vercel Analytics + Speed Insights:
 *   pnpm add @vercel/analytics @vercel/speed-insights
 *   Then uncomment the imports and JSX below.
 */

import { useEffect, useState } from 'react'
// import { Analytics } from '@vercel/analytics/next'
// import { SpeedInsights } from '@vercel/speed-insights/next'

function hasConsent(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie
    .split(';')
    .some((c) => c.trim() === 'cookie_consent=accepted')
}

export default function ConditionalAnalytics() {
  const [accepted, setAccepted] = useState(hasConsent)

  useEffect(() => {
    const handler = () => setAccepted(true)
    window.addEventListener('cookie-consent-accepted', handler)
    return () => window.removeEventListener('cookie-consent-accepted', handler)
  }, [])

  if (!accepted) return null

  return (
    <>
      {/* <Analytics /> */}
      {/* <SpeedInsights /> */}
    </>
  )
}
