'use client'

import React, { useEffect, useRef, useState } from 'react'
import CarouselWorkCard from './CarouselWorkCard'
import { WorkItem, StrapiEntity } from '@/types/strapi'

type CarouselBlockProps = {
  workItems?: (WorkItem & StrapiEntity)[]
  scrollSpeed?: number
}

const CarouselBlock = ({
  workItems = [],
  scrollSpeed = 5,
}: CarouselBlockProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  useEffect(() => {
    if (!workItems || workItems.length === 0) return

    if (scrollRef.current) {
      const singleSetWidth = scrollRef.current.scrollWidth / 3
      scrollRef.current.scrollLeft = singleSetWidth
    }
  }, [workItems])

  useEffect(() => {
    if (!workItems || workItems.length === 0 || isPaused || isDragging) return

    let animationFrameId: number
    let lastTimestamp = 0

    const scroll = (timestamp: number) => {
      if (!scrollRef.current) {
        animationFrameId = requestAnimationFrame(scroll)
        return
      }

      const elapsed = timestamp - lastTimestamp

      if (elapsed >= scrollSpeed) {
        const { scrollLeft: current, scrollWidth } = scrollRef.current
        const singleSetWidth = scrollWidth / 3

        if (current >= singleSetWidth * 2) {
          scrollRef.current.scrollLeft = singleSetWidth
        } else {
          scrollRef.current.scrollLeft += 1
        }

        lastTimestamp = timestamp
      }

      animationFrameId = requestAnimationFrame(scroll)
    }

    animationFrameId = requestAnimationFrame(scroll)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [workItems, scrollSpeed, isPaused, isDragging])

  if (!workItems || workItems.length === 0) {
    return null
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setScrollLeft(scrollRef.current.scrollLeft)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX) * 0.5
    scrollRef.current.scrollLeft = scrollLeft - walk

    const { scrollLeft: currentScroll, scrollWidth } = scrollRef.current
    const singleSetWidth = scrollWidth / 3

    if (currentScroll >= singleSetWidth * 2) {
      scrollRef.current.scrollLeft = singleSetWidth
      setScrollLeft(singleSetWidth)
    } else if (currentScroll <= 0) {
      scrollRef.current.scrollLeft = singleSetWidth
      setScrollLeft(singleSetWidth)
    }
  }

  const handleMouseUpOrLeave = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft)
    setScrollLeft(scrollRef.current.scrollLeft)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft
    const walk = (x - startX) * 0.5
    scrollRef.current.scrollLeft = scrollLeft - walk

    const { scrollLeft: currentScroll, scrollWidth } = scrollRef.current
    const singleSetWidth = scrollWidth / 3

    if (currentScroll >= singleSetWidth * 2) {
      scrollRef.current.scrollLeft = singleSetWidth
      setScrollLeft(singleSetWidth)
    } else if (currentScroll <= 0) {
      scrollRef.current.scrollLeft = singleSetWidth
      setScrollLeft(singleSetWidth)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  return (
    <div className="relative w-full overflow-hidden my-8">
      <div
        ref={scrollRef}
        className="flex items-stretch gap-6 overflow-x-hidden select-none py-6"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          setIsPaused(false)
          handleMouseUpOrLeave()
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Set réel — seule instance indexée par les moteurs de recherche */}
        {workItems.map((item, index) => (
          <div key={`real-${item.id}`} className="w-[220px] flex-shrink-0 flex">
            <CarouselWorkCard item={item} isPriority={index < 6} />
          </div>
        ))}
        {/* Copies visuelles pour la boucle infinie — masquées aux lecteurs d'écran et aux robots */}
        <div inert className="contents">
          {workItems.map((item, index) => (
            <div key={`clone-a-${item.id}-${index}`} className="w-[220px] flex-shrink-0 flex">
              <CarouselWorkCard item={item} isPriority={false} />
            </div>
          ))}
        </div>
        <div inert className="contents">
          {workItems.map((item, index) => (
            <div key={`clone-b-${item.id}-${index}`} className="w-[220px] flex-shrink-0 flex">
              <CarouselWorkCard item={item} isPriority={false} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CarouselBlock
