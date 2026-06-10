'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

type HeroBlockProps = {
  title?: string
  content: string
  height?: 'little' | 'medium' | 'large' | 'full'
  textAlignment?: 'left' | 'center' | 'right'
}

const HeroBlockSimpleText = ({
  title,
  content,
  height = 'large',
  textAlignment = 'center',
}: HeroBlockProps) => {
  const shouldReduce = useReducedMotion()
  const heightClasses = {
    little: 'min-h-[220px] py-8',
    medium: 'min-h-[550px] py-16',
    large: 'min-h-[750px] py-24',
    full: 'min-h-screen py-32',
  }

  const textAlignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  }

  return (
    <section className={`${heightClasses[height]} flex items-center justify-center`}>
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className={`flex flex-col ${textAlignmentClasses[textAlignment]} gap-6`}>
          {title && (
            <motion.h1
              className="text-3xl md:text-4xl lg:text-5xl font-medium"
              initial={shouldReduce ? {} : { opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={shouldReduce ? { duration: 0 } : { duration: 0.6, ease: 'easeOut' }}
            >
              {title}
            </motion.h1>
          )}
          
          <motion.p
            className="text-lg md:text-xl lg:text-2xl max-w-4xl whitespace-pre-line"
            initial={shouldReduce ? {} : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={shouldReduce ? { duration: 0 } : { duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          >
            {content}
          </motion.p>
        </div>
      </div>
    </section>
  )
}

export default HeroBlockSimpleText
