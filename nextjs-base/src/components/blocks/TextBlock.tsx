'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { StrapiBlock } from '@/types/strapi'
import { renderStrapiBlocks } from '@/lib/strapi-rich-text'

type TextBlockProps = {
  content: StrapiBlock[]
  textAlignment?: 'left' | 'center' | 'right' | 'justify'
  blockAlignment?: 'left' | 'center' | 'right' | 'full'
  maxWidth?: 'small' | 'medium' | 'large' | 'full'
}

const TextBlock = ({
  content,
  textAlignment = 'left',
  blockAlignment = 'full',
  maxWidth = 'full',
}: TextBlockProps) => {
  const shouldReduce = useReducedMotion()

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  }

  const blockAlignmentClasses = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto',
    full: 'w-full',
  }

  const maxWidthClasses = {
    small: 'max-w-2xl',
    medium: 'max-w-4xl',
    large: 'max-w-6xl',
    full: 'max-w-none',
  }

  return (
    <motion.div
      className={`${blockAlignmentClasses[blockAlignment]} ${maxWidthClasses[maxWidth]}`}
      initial={shouldReduce ? {} : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={shouldReduce ? { duration: 0 } : { duration: 0.6, ease: 'easeOut' }}
    >
      <div className="prose max-w-none">
        {renderStrapiBlocks(content, {
          textAlignmentClass: alignmentClasses[textAlignment],
          textColorClass: 'text-gray-700',
        })}
      </div>
    </motion.div>
  )
}

export default TextBlock
