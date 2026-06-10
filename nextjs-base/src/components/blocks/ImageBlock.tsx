'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { StrapiMedia } from '@/types/strapi'
import { cleanImageUrl } from '@/lib/strapi'

type ImageBlockProps = {
  image: StrapiMedia
  caption?: string
  alignment: 'left' | 'center' | 'right' | 'full'
  size: 'small' | 'medium' | 'large' | 'full'
  priority?: boolean
}

const ImageBlock = ({ image, caption, alignment, size, priority }: ImageBlockProps) => {
  const shouldReduce = useReducedMotion()
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || shouldReduce || priority) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [shouldReduce, priority])

  const imageSrc = cleanImageUrl(image.url)
  const finalImageSrc = imageSrc && imageSrc.startsWith('/') 
    ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${imageSrc}` 
    : imageSrc || ''

  const alignmentClasses = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto',
    full: 'w-full',
  }

  const sizeClasses = {
    small: 'max-w-sm',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    full: 'w-full',
  }

  return (
    <motion.figure
      ref={ref}
      className={`my-6 ${alignmentClasses[alignment]} ${sizeClasses[size]}`}
      initial={priority ? { opacity: 1, y: 0 } : { opacity: 0, y: 80 }}
      animate={
        priority || shouldReduce || visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 80 }
      }
      transition={
        priority || shouldReduce ? { duration: 0 } : { duration: 0.7, ease: 'easeOut' }
      }
    >
      <Image
        src={finalImageSrc}
        alt={image.alternativeText || caption || 'Image'}
        width={image.width || 800}
        height={image.height || 600}
        className="w-full h-auto object-cover rounded-lg"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
        quality={85}
        priority={priority}
        fetchPriority={priority ? 'high' : undefined}
      />
      {caption && (
        <figcaption className="text-sm text-gray-600 mt-2 text-center italic">
          {caption}
        </figcaption>
      )}
    </motion.figure>
  )
}

export default ImageBlock
