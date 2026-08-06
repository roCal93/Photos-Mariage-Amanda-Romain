import React from 'react'
import * as Blocks from '@/components/blocks'
const kebabToPascal = (s: string): string =>
  s
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')

type BlocksMap = Record<string, React.ComponentType<Record<string, unknown>>>
const TypedBlocks = Blocks as unknown as BlocksMap

type DynamicBlock = { __component?: string } & Record<string, unknown>

type SectionGenericProps = {
  title?: string
  blocks: DynamicBlock[]
  identifier?: string
  spacingTop?: 'none' | 'small' | 'medium' | 'large'
  spacingBottom?: 'none' | 'small' | 'medium' | 'large'
  containerWidth?: 'small' | 'medium' | 'large' | 'full'
  isFirstSection?: boolean
}

export const SectionGeneric = ({
  identifier,
  title,
  blocks,
  spacingTop = 'medium',
  spacingBottom = 'medium',
  containerWidth = 'medium',
  isFirstSection = false,
}: SectionGenericProps) => {
  // Pre-compute the index of the first ImageBlock for LCP priority (only needed in first section)
  const firstImageBlockIndex = isFirstSection
    ? (blocks || []).findIndex((b) => {
        const raw = (b as { __component?: string }).__component ?? ''
        const key = raw.split('.').pop() || raw
        return kebabToPascal(key) === 'ImageBlock'
      })
    : -1

  const getContainerWidthClass = (
    width: 'small' | 'medium' | 'large' | 'full'
  ) => {
    switch (width) {
      case 'small':
        return 'max-w-3xl'
      case 'medium':
        return 'max-w-6xl'
      case 'large':
        return 'max-w-7xl'
      case 'full':
        return 'max-w-full'
      default:
        return 'max-w-6xl'
    }
  }
  const renderBlock = (block: DynamicBlock, index: number) => {
    // Try to render a matching React block component from `src/components/blocks`.
    // Component names are derived from Strapi __component like 'blocks.text-block' -> 'TextBlock'
    const raw = (block as { __component?: string }).__component ?? ''
    const key = raw.split('.').pop() || raw
    const componentName = kebabToPascal(key)
    const BlockComponent = TypedBlocks[componentName] as
      | React.ComponentType<Record<string, unknown>>
      | undefined

    if (BlockComponent) {
      // Add priority to the first ImageBlock of the first section (LCP optimization)
      const isLCPImage = index === firstImageBlockIndex
      const blockProps = block as Record<string, unknown>
      const finalProps = isLCPImage
        ? { ...blockProps, priority: true }
        : blockProps

      return <BlockComponent key={index} {...finalProps} />
    }

    // Fallback placeholder (starter)
    return (
      <div
        key={index}
        className="p-4 border-2 border-dashed border-gray-300 rounded-lg"
      >
        <p className="text-gray-500 text-center">
          Block: {block.__component} (placeholder - will be replaced by
          create-hakuna-app)
        </p>
      </div>
    )
  }

  const getSpacingClass = (
    spacing: 'none' | 'small' | 'medium' | 'large',
    side: 'top' | 'bottom'
  ) => {
    const prefix = side === 'top' ? 'pt' : 'pb'
    switch (spacing) {
      case 'none':
        return ''
      case 'small':
        return `${prefix}-6`
      case 'medium':
        return `${prefix}-12`
      case 'large':
        return `${prefix}-24`
      default:
        return `${prefix}-12`
    }
  }

  return (
    <section
      id={identifier}
      className={`${getSpacingClass(spacingTop, 'top')} ${getSpacingClass(spacingBottom, 'bottom')} px-4`}
    >
      <div className={`${getContainerWidthClass(containerWidth)} mx-auto`}>
        {title && (
          <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>
        )}
        <div className="space-y-4">
          {blocks?.map((block, index) => renderBlock(block, index))}
        </div>
      </div>
    </section>
  )
}
