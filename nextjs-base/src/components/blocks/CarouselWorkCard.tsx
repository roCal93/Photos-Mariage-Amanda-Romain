'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { WorkItem, StrapiBlock, StrapiEntity } from '@/types/strapi'
import { cleanImageUrl } from '@/lib/strapi'
import { renderStrapiBlocks } from '@/lib/strapi-rich-text'

type CarouselWorkCardProps = {
  item: WorkItem & StrapiEntity
  isPriority?: boolean
}

const CarouselWorkCard = ({ item, isPriority = false }: CarouselWorkCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const imageUrl = cleanImageUrl(item.image?.url)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsFlipped(!isFlipped)
    }
  }

  return (
    <div 
      className="relative w-full h-96 cursor-pointer perspective-1000 select-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      onClick={() => setIsFlipped(!isFlipped)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${isFlipped ? 'Masquer' : 'Voir'} les détails de ${item.title}`}
    >
      <div 
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
        }}
      >
        {/* Front - Image et titre */}
        <div 
          className="absolute w-full h-full backface-hidden bg-white rounded-lg shadow-lg overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {imageUrl ? (
            <div className="relative w-full h-full">
              <Image 
                src={imageUrl} 
                alt={item.image?.alternativeText || item.title} 
                fill
                priority={isPriority}
                fetchPriority={isPriority ? 'high' : 'low'}
                loading={isPriority ? undefined : 'lazy'}
                className="object-cover select-none pointer-events-none"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                draggable={false}
                quality={85}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-3xl font-bold text-white mb-2">{item.title}</h3>
                {item.shortDescription && (
                  <p className="text-white/90 text-sm line-clamp-2">{item.shortDescription}</p>
                )}
                {item.featured && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                    Featured
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center p-6">
              <h3 className="text-3xl font-bold text-gray-800 text-center mb-2">{item.title}</h3>
              {item.shortDescription && (
                <p className="text-gray-600 text-center">{item.shortDescription}</p>
              )}
            </div>
          )}
        </div>

        {/* Back - Détails complets */}
        <div 
          className="absolute w-full h-full backface-hidden bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="h-full overflow-auto">
            <h3 className="text-2xl font-bold text-indigo-900 mb-3">{item.title}</h3>
            
            {/* Métadonnées (client, année) */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-700 mb-4">
              {item.client && (
                <span className="flex items-center gap-1">
                  <span className="font-semibold">Client:</span> {item.client}
                </span>
              )}
              {item.year && (
                <span className="flex items-center gap-1">
                  <span className="font-semibold">Année:</span> {item.year}
                </span>
              )}
            </div>

            {/* Catégories */}
            {item.categories && item.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {item.categories.map((category) => (
                  <span
                    key={category.id}
                    className="px-3 py-1 text-sm rounded-full"
                    style={{
                      backgroundColor: category.color ? `${category.color}20` : '#f3f4f6',
                      color: category.color || '#6b7280',
                    }}
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {item.description && (
              <div className="mb-4 text-sm">
                {renderStrapiBlocks(item.description as StrapiBlock[], {
                  textAlignmentClass: 'text-left',
                  textColorClass: 'text-gray-700',
                })}
              </div>
            )}

            {/* Technologies */}
            {item.technologies && typeof item.technologies === 'object' && (
              <div className="mb-4">
                <h4 className="font-bold text-sm mb-2 text-indigo-900">Technologies</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.values(item.technologies).map((tech, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-white text-gray-700 text-xs rounded shadow-sm"
                    >
                      {String(tech)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Fields */}
            {item.customFields && typeof item.customFields === 'object' && Object.keys(item.customFields).length > 0 && (
              <div className="mb-4">
                <h4 className="font-bold text-sm mb-2 text-indigo-900">Informations complémentaires</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {Object.entries(item.customFields).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium text-gray-700">{key}: </span>
                      <span className="text-gray-600">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lien externe */}
            {item.link && (
              <Link
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Voir le projet
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CarouselWorkCard
