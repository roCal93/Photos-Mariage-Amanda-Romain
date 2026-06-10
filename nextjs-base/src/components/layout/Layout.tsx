import React, { ReactNode } from 'react'
import { SkipToContent } from '@/components/ui/SkipToContent'
import type {
  PageCollectionResponse,
  Section,
  StrapiEntity,
} from '@/types/strapi'

type LayoutProps = {
  children: ReactNode
  locale: string
}

export const Layout = async ({ children, locale }: LayoutProps) => {
  return (
    <div className="relative flex flex-col min-h-screen">
      <SkipToContent />
      <main
        id="main-content"
        role="main"
        aria-label="Main content"
        className="flex-1"
      >
        {children}
      </main>
    </div>
  )
}
