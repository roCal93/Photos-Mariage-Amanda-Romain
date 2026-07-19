'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MouseEvent } from 'react'
import type { ReactNode } from 'react'

type BackToGalleryButtonProps = {
  href: string
  className?: string
  children: ReactNode
}

export function BackToGalleryButton({
  href,
  className,
  children,
}: BackToGalleryButtonProps) {
  const router = useRouter()

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()

    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push(href)
  }

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  )
}
