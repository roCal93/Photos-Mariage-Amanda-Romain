'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { cleanImageUrl } from '@/lib/strapi'
import { StrapiBlock } from '@/types/strapi'

type CarouselCardProps = {
  frontTitle: string
  frontContent?: StrapiBlock[]
  backContent?: StrapiBlock[]
  image?: { url: string; alternativeText?: string }
}

const CarouselCard = ({ frontTitle, frontContent, backContent, image }: CarouselCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const cleanImage = cleanImageUrl(image?.url)

  const renderBlocks = (blocks?: StrapiBlock[]) => {
    if (!blocks) return null
    
    return blocks.map((block, index) => {
      switch (block.type) {
        case 'paragraph':
          return (
            <p key={index} className="text-gray-600 mb-2">
              {block.children?.map((child, childIndex) => {
                if (child.type === 'text') {
                  let content = <span key={childIndex}>{child.text}</span>
                  if (child.bold) content = <strong key={childIndex}>{child.text}</strong>
                  if (child.italic) content = <em key={childIndex}>{child.text}</em>
                  return content
                }
                return null
              })}
            </p>
          )
        case 'heading':
          const level = block.level || 3
          const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements
          return (
            <HeadingTag key={index} className="font-semibold mb-2">
              {block.children?.map((child, childIndex) => {
                if (child.type === 'text') {
                  return <span key={childIndex}>{child.text}</span>
                }
                return null
              })}
            </HeadingTag>
          )
        default:
          return null
      }
    })
  }

  return (
    <div 
      className="relative w-full h-96 cursor-pointer perspective-1000"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div 
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
        }}
      >
        {/* Front */}
        <div 
          className="absolute w-full h-full backface-hidden bg-white rounded-lg shadow-lg overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="p-6 h-full flex flex-col items-center justify-center">
            <h3 className="text-2xl font-bold mb-4 text-center">{frontTitle}</h3>
            <div className="mb-4 text-center">
              {renderBlocks(frontContent)}
            </div>
            {cleanImage && (
              <div className="relative w-full max-w-md h-64 flex-shrink-0">
                <Image 
                  src={cleanImage} 
                  alt={image?.alternativeText || frontTitle} 
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 448px"
                />
              </div>
            )}
          </div>
        </div>

        {/* Back */}
        <div 
          className="absolute w-full h-full backface-hidden bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="h-full overflow-auto">
            <h3 className="text-2xl font-bold mb-4 text-indigo-900">Plus d&apos;informations</h3>
            {renderBlocks(backContent)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CarouselCard
