import React, { ReactNode } from 'react'
import { SkipToContent } from '@/components/ui/SkipToContent'

type LayoutProps = {
  children: ReactNode
  locale: string
}

export const Layout = async ({ children }: LayoutProps) => {
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
