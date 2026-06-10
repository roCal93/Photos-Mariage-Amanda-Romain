import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  hasRenderableRichText,
  renderInlineNode,
  type StrapiRichNode,
} from './strapi-rich-text'

describe('strapi rich text renderer', () => {
  it('renders html nodes with a strict tag whitelist', () => {
    const node: StrapiRichNode = {
      type: 'html',
      value: 'x<sup>2</sup><script>alert(1)</script><strong>ok</strong>',
    }

    const html = renderToStaticMarkup(<>{renderInlineNode(node, 'k')}</>)

    expect(html).toContain('<sup>2</sup>')
    expect(html).toContain('<strong>ok</strong>')
    expect(html).not.toContain('<script>')
  })

  it('renders sup and sub inline markers from text content', () => {
    const node: StrapiRichNode = {
      text: 'CO<sub>2</sub> and x<sup>2</sup>',
    }

    const html = renderToStaticMarkup(<>{renderInlineNode(node, 'k')}</>)

    expect(html).toContain('<sub>2</sub>')
    expect(html).toContain('<sup>2</sup>')
  })

  it('keeps external link security attributes', () => {
    const node: StrapiRichNode = {
      type: 'link',
      url: 'https://example.com',
      children: [{ text: 'Visit' }],
    }

    const html = renderToStaticMarkup(<>{renderInlineNode(node, 'k')}</>)

    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('detects renderable nodes in nested content', () => {
    const node: StrapiRichNode = {
      type: 'paragraph',
      children: [{ text: 'Nested text' }],
    }

    expect(hasRenderableRichText(node)).toBe(true)
    expect(hasRenderableRichText({ type: 'paragraph', children: [] })).toBe(
      false
    )
  })
})
