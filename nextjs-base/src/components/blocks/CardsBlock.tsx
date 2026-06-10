'use client'
import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Card as CardData, StrapiEntity } from '@/types/strapi'
import { Card } from './Card'

type CardsBlockProps = {
  cards: (CardData & StrapiEntity)[]
  columns: '1' | '2' | '3' | '4'
  alignment?: 'left' | 'center' | 'right'
  overlap?: boolean
}

const CardsBlock = ({ cards, columns, alignment = 'center', overlap = false }: CardsBlockProps) => {
  const shouldReduce = useReducedMotion()

  const getInitial = (index: number) => {
    if (shouldReduce) return {}
    const directions = [
      { opacity: 0, x: -90 },
      { opacity: 0, y: 90 },
      { opacity: 0, x: 90 },
    ]
    return directions[index % directions.length]
  }

  const columnClasses = {
    '1': 'grid-cols-1 max-w-3xl mx-auto',
    '2': 'grid-cols-1 md:grid-cols-2',
    '3': 'grid-cols-1 md:grid-cols-3',
    '4': 'grid-cols-1 md:grid-cols-4',
  }

  const alignmentClasses = {
    left: 'justify-items-start',
    center: 'justify-items-center',
    right: 'justify-items-end',
  }

  // Add width classes for individual cards based on column count
  const cardWidthClasses = {
    '1': 'w-full',
    '2': 'w-full',
    '3': 'w-full',
    '4': 'w-full',
  }

  if (overlap) {
    return (
      <div className="flex flex-col md:flex-row items-center justify-center my-8 px-4 sm:px-8 gap-4 md:gap-0">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            className={`relative w-full sm:w-96 md:w-80 lg:w-96 xl:w-[28rem] flex-shrink-0 cursor-pointer ${index > 0 ? 'md:-ml-10 lg:-ml-12' : ''}`}
            style={{ zIndex: index === 0 ? cards.length : cards.length - index }}
            custom={index}
            variants={{
              hidden: (i: number) => getInitial(i),
              visible: (i: number) => ({
                opacity: 1, x: 0, y: 0,
                transition: shouldReduce
                  ? { duration: 0 }
                  : { duration: 1.5, delay: i * 0.3, ease: [0.22, 1, 0.36, 1] },
              }),
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.45 }}
          >
            <div className="transition-transform duration-300 hover:-translate-y-6 hover:scale-105">
              <Card
                title={card.title}
                subtitle={card.subtitle}
                content={card.content || []}
                image={card.image}
                mobileImage={card.mobileImage}
              />
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <div className={`grid ${columnClasses[columns]} ${alignmentClasses[alignment]} gap-6 my-8`}>
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          className={cardWidthClasses[columns]}
          custom={index}
          variants={{
            hidden: (i: number) => getInitial(i),
            visible: (i: number) => ({
              opacity: 1, x: 0, y: 0,
              transition: shouldReduce
                ? { duration: 0 }
                : { duration: 1, delay: i * 0.2, ease: [0.22, 1, 0.36, 1] },
            }),
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.45 }}
        >
          <Card
            title={card.title}
            subtitle={card.subtitle}
            content={card.content || []}
            image={card.image}
            mobileImage={card.mobileImage}
          />
        </motion.div>
      ))}
    </div>
  )
}

export default CardsBlock
