import React from 'react'
import sanitize from 'sanitize-html'
import { StrapiBlock } from '@/types/strapi'

export type StrapiRichNode = {
  type?: string
  text?: string
  value?: string
  url?: string
  href?: string
  target?: string
  rel?: string
  level?: number
  format?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  code?: boolean
  children?: StrapiRichNode[]
  content?: StrapiRichNode[]
  [key: string]: unknown
}

const BREAK_TYPES = new Set(['hardBreak', 'lineBreak', 'break', 'hard_break'])

// Allowlist-based sanitizer — strips unknown tags, event handlers, and dangerous URL schemes
const sanitizeHtml = (html: string): string =>
  sanitize(html, {
    allowedTags: ['sup', 'sub', 'br', 'span', 'strong', 'em', 'u', 'i', 'b'],
    allowedAttributes: { span: ['class'] },
    disallowedTagsMode: 'discard',
  })

export const getStrapiNodeText = (node: StrapiRichNode): string => {
  if (typeof node.text === 'string') return node.text
  if (typeof node.value === 'string') return node.value
  return ''
}

export const getStrapiNodeChildren = (node: unknown): StrapiRichNode[] => {
  if (!node || typeof node !== 'object') return []
  const casted = node as StrapiRichNode
  if (Array.isArray(casted.children)) return casted.children
  if (Array.isArray(casted.content)) return casted.content
  return []
}

const withMarks = (node: StrapiRichNode, content: React.ReactNode) => {
  let rendered = content

  if (node.code) {
    rendered = (
      <code className="px-1 py-0.5 rounded bg-black/5 font-mono text-[0.95em]">
        {rendered}
      </code>
    )
  }
  if (node.bold) rendered = <strong>{rendered}</strong>
  if (node.italic) rendered = <em>{rendered}</em>
  if (node.underline) rendered = <span className="underline">{rendered}</span>
  if (node.strikethrough)
    rendered = <span className="line-through">{rendered}</span>

  return rendered
}

const normalizeHref = (href: string) => {
  if (href.startsWith('www.')) return `https://${href}`
  return href
}

const renderSupInText = (
  text: string,
  keyPrefix: string
): React.ReactNode[] => {
  const parts = text.split(/(<sup>.*?<\/sup>|<sub>.*?<\/sub>)/gi)

  return parts.map((part, index) => {
    const supMatch = part.match(/^<sup>(.*?)<\/sup>$/i)
    if (supMatch) {
      return <sup key={`${keyPrefix}-sup-${index}`}>{supMatch[1]}</sup>
    }

    const subMatch = part.match(/^<sub>(.*?)<\/sub>$/i)
    if (subMatch) {
      return <sub key={`${keyPrefix}-sub-${index}`}>{subMatch[1]}</sub>
    }

    return (
      <React.Fragment key={`${keyPrefix}-txt-${index}`}>{part}</React.Fragment>
    )
  })
}

export const renderInlineNode = (
  node: StrapiRichNode,
  key: React.Key
): React.ReactNode => {
  const keyString = String(key)
  const type = node.type || 'text'

  if (BREAK_TYPES.has(type)) return <br key={key} />

  if (type === 'html' && typeof node.value === 'string') {
    const safe = sanitizeHtml(node.value)
    return <span key={key} dangerouslySetInnerHTML={{ __html: safe }} />
  }

  if (type === 'link' || type === 'hyperlink') {
    const hrefValue =
      typeof node.url === 'string'
        ? node.url
        : typeof node.href === 'string'
          ? node.href
          : ''

    const href = hrefValue ? normalizeHref(hrefValue) : '#'
    const isExternal = /^https?:\/\//.test(href)
    const children = renderInlineNodes(
      getStrapiNodeChildren(node),
      `${keyString}-link`
    )
    const content =
      children.length > 0
        ? children
        : [
            <React.Fragment key={`${keyString}-txt`}>
              {hrefValue}
            </React.Fragment>,
          ]

    return (
      <a
        key={key}
        href={href}
        target={
          typeof node.target === 'string'
            ? node.target
            : isExternal
              ? '_blank'
              : undefined
        }
        rel={
          typeof node.rel === 'string'
            ? node.rel
            : isExternal
              ? 'noopener noreferrer'
              : undefined
        }
        className="underline underline-offset-2 decoration-stone-500 hover:decoration-stone-800"
      >
        {content}
      </a>
    )
  }

  const text = getStrapiNodeText(node)
  if (text) {
    const textWithBreaks = text.split(/\r?\n/).map((line, index) => (
      <React.Fragment key={index}>
        {index > 0 && <br />}
        {renderSupInText(line, `${keyString}-line-${index}`)}
      </React.Fragment>
    ))
    return (
      <React.Fragment key={key}>
        {withMarks(node, textWithBreaks)}
      </React.Fragment>
    )
  }

  const nestedChildren = getStrapiNodeChildren(node)
  if (nestedChildren.length > 0) {
    return (
      <React.Fragment key={key}>
        {renderInlineNodes(nestedChildren, `${keyString}-nested`)}
      </React.Fragment>
    )
  }

  return null
}

export const renderInlineNodes = (
  nodes: StrapiRichNode[],
  keyPrefix = 'node'
): React.ReactNode[] => {
  return nodes
    .map((node, index) => renderInlineNode(node, `${keyPrefix}-${index}`))
    .filter(Boolean)
}

const renderListItems = (
  nodes: StrapiRichNode[],
  keyPrefix: string,
  listItemClassName: string
): React.ReactNode[] => {
  return nodes.map((node, index) => {
    const itemChildren = getStrapiNodeChildren(node)
    const itemKey = `${keyPrefix}-${index}`

    return (
      <li key={itemKey} className={listItemClassName}>
        {itemChildren.map((child, childIndex) => {
          const childType = child.type || ''
          const childKey = `${itemKey}-child-${childIndex}`

          if (childType === 'list') {
            return renderListBlock(child, childKey, listItemClassName)
          }

          if (childType === 'paragraph' || childType === 'heading') {
            return (
              <React.Fragment key={childKey}>
                {renderInlineNodes(
                  getStrapiNodeChildren(child),
                  `${childKey}-inline`
                )}
              </React.Fragment>
            )
          }

          return (
            <React.Fragment key={childKey}>
              {renderInlineNode(child, childKey)}
            </React.Fragment>
          )
        })}
      </li>
    )
  })
}

export const renderListBlock = (
  block: StrapiRichNode,
  key: React.Key,
  listItemClassName = 'mb-2 whitespace-pre-line',
  extraClassName?: string
): React.ReactNode => {
  const keyString = String(key)
  const ListTag = block.format === 'ordered' ? 'ol' : 'ul'
  const listClass = block.format === 'ordered' ? 'list-decimal' : 'list-disc'

  return (
    <ListTag
      key={key}
      className={`${listClass} ml-6 ${extraClassName || ''}`.trim()}
    >
      {renderListItems(
        getStrapiNodeChildren(block),
        `${keyString}-li`,
        listItemClassName
      )}
    </ListTag>
  )
}

export const hasRenderableRichText = (node: unknown): boolean => {
  if (!node || typeof node !== 'object') return false
  const casted = node as StrapiRichNode
  const type = casted.type || ''

  if (BREAK_TYPES.has(type)) return true

  const text = getStrapiNodeText(casted)
  if (typeof text === 'string' && text.trim().length > 0) return true

  const children = getStrapiNodeChildren(casted)
  if (children.length === 0) return false

  return children.some((child) => hasRenderableRichText(child))
}

type RenderBlocksOptions = {
  textAlignmentClass: string
  textColorClass?: string
}

export const renderStrapiBlocks = (
  blocks: StrapiBlock[],
  options: RenderBlocksOptions
) => {
  const headingClasses = {
    1: 'text-4xl font-bold mb-6',
    2: 'text-3xl font-bold mb-5',
    3: 'text-2xl font-bold mb-4',
    4: 'text-xl font-bold mb-3',
    5: 'text-lg font-bold mb-2',
    6: 'text-base font-bold mb-2',
  }
  const textColor = options.textColorClass || 'text-gray-700'

  return blocks.map((block, index) => {
    const type = block.type || 'paragraph'

    switch (type) {
      case 'paragraph':
        return (
          <p
            key={index}
            className={`${textColor} mb-4 whitespace-pre-line ${options.textAlignmentClass}`}
          >
            {renderInlineNodes(getStrapiNodeChildren(block), `p-${index}`)}
          </p>
        )
      case 'heading': {
        const level = Number(block.level) || 2
        const safeLevel = Math.max(1, Math.min(6, level)) as
          | 1
          | 2
          | 3
          | 4
          | 5
          | 6
        const HeadingTag = `h${safeLevel}` as keyof React.JSX.IntrinsicElements
        return (
          <HeadingTag
            key={index}
            className={`${headingClasses[safeLevel]} ${options.textAlignmentClass}`}
          >
            {renderInlineNodes(getStrapiNodeChildren(block), `h-${index}`)}
          </HeadingTag>
        )
      }
      case 'list':
        return renderListBlock(
          block,
          index,
          'mb-2',
          `mb-4 ${textColor} ${options.textAlignmentClass}`
        )
      case 'quote':
      case 'blockquote':
        return (
          <blockquote
            key={index}
            className={`mb-4 whitespace-pre-line border-l-4 border-stone-300 pl-4 italic ${textColor} ${options.textAlignmentClass}`}
          >
            {renderInlineNodes(getStrapiNodeChildren(block), `q-${index}`)}
          </blockquote>
        )
      case 'code':
      case 'codeBlock':
      case 'pre': {
        const codeText = getStrapiNodeChildren(block)
          .map((child) => getStrapiNodeText(child))
          .join('')
        return (
          <pre
            key={index}
            className="mb-4 overflow-x-auto rounded-lg bg-stone-900 p-4 text-sm text-stone-100"
          >
            <code>{codeText}</code>
          </pre>
        )
      }
      default:
        return (
          <div
            key={index}
            className={`${textColor} mb-4 ${options.textAlignmentClass}`}
          >
            {renderInlineNodes(getStrapiNodeChildren(block), `u-${index}`)}
          </div>
        )
    }
  })
}
