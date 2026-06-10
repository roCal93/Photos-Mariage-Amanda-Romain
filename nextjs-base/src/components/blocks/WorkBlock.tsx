'use client'

import React, { useState, useMemo, useRef } from 'react'
import { WorkItem, WorkCategory, StrapiEntity } from '@/types/strapi'
import WorkCard from './WorkCard'

type WorkBlockProps = {
  filterByCategories?: (WorkCategory & StrapiEntity)[]
  showAllCategories?: boolean
  showFeaturedOnly?: boolean

  limit?: number
  columns?: '2' | '3' | '4'
  showFilters?: boolean
  layout?: 'grid' | 'masonry' | 'list'
}

const WorkBlock = ({
  filterByCategories = [],
  showAllCategories = true,
  showFeaturedOnly = false,
  limit = 12,
  columns = '3',
  showFilters = true,
  layout = 'grid',
}: WorkBlockProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [workItems, setWorkItems] = useState<(WorkItem & StrapiEntity)[]>([])
  const [loading, setLoading] = useState(true)
  const lastFetchKeyRef = useRef<string>('')

  const categoryIds = useMemo(
    () => filterByCategories.map((c) => c.id),
    [filterByCategories]
  )
  const categoryIdsKey = useMemo(() => categoryIds.join(','), [categoryIds])
  const fetchKey = useMemo(
    () => [showAllCategories, showFeaturedOnly, limit, categoryIdsKey].join('|'),
    [showAllCategories, showFeaturedOnly, limit, categoryIdsKey]
  )

  // Fetch work items
  React.useEffect(() => {
    if (lastFetchKeyRef.current === fetchKey) return
    lastFetchKeyRef.current = fetchKey

    const fetchWorkItems = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          'populate[categories][fields][0]': 'name',
          'populate[categories][fields][1]': 'slug',
          'populate[categories][fields][2]': 'color',
          'populate[image][fields][0]': 'url',
          'populate[image][fields][1]': 'alternativeText',
          'populate[image][fields][2]': 'width',
          'populate[image][fields][3]': 'height',
          'sort[0]': 'order:asc',
          'sort[1]': 'createdAt:desc',
          'pagination[limit]': limit.toString(),
        })

        if (showFeaturedOnly) {
          params.append('filters[featured][$eq]', 'true')
        }



        if (!showAllCategories && categoryIds.length > 0) {
          categoryIds.forEach((categoryId, index) => {
            params.append(`filters[categories][id][$in][${index}]`, categoryId.toString())
          })
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/work-items?${params.toString()}`
        )
        const data = await response.json()
        setWorkItems(data.data || [])
      } catch (error) {
        console.error('Error fetching work items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkItems()
  }, [fetchKey, categoryIds, showAllCategories, showFeaturedOnly, limit])

  // Get all unique categories from loaded items
  const availableCategories = useMemo(() => {
    const categoriesMap = new Map<number, WorkCategory & StrapiEntity>()
    
    workItems.forEach((item) => {
      item.categories?.forEach((category) => {
        if (!categoriesMap.has(category.id)) {
          categoriesMap.set(category.id, category)
        }
      })
    })

    return Array.from(categoriesMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    )
  }, [workItems])

  // Filter items based on selected category
  const filteredItems = useMemo(() => {
    if (!selectedCategory) return workItems

    return workItems.filter((item) =>
      item.categories?.some((category) => category.slug === selectedCategory)
    )
  }, [workItems, selectedCategory])

  const columnClasses = {
    '2': 'grid-cols-1 md:grid-cols-2',
    '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!workItems.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        Aucun élément de travail disponible.
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Category filters */}
      {showFilters && availableCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-red-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tous
          </button>
          {availableCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.slug
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={
                selectedCategory === category.slug && category.color
                  ? { backgroundColor: category.color, color: 'white' }
                  : undefined
              }
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {/* Work items display */}
      {layout === 'list' ? (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <WorkCard key={item.id} item={item} layout="list" />
          ))}
        </div>
      ) : (
        <div
          className={`grid ${columnClasses[columns]} gap-6 ${
            layout === 'masonry' ? 'auto-rows-max' : ''
          }`}
        >
          {filteredItems.map((item) => (
            <WorkCard key={item.id} item={item} layout={layout} />
          ))}
        </div>
      )}

      {/* No results message */}
      {filteredItems.length === 0 && selectedCategory && (
        <div className="text-center py-12 text-gray-500">
          Aucun élément trouvé pour cette catégorie.
        </div>
      )}
    </div>
  )
}

export default WorkBlock
