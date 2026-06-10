import { describe, expect, it } from 'vitest'
import { formatLegalContent } from './format-legal-content'

describe('formatLegalContent', () => {
  it('returns empty string for empty input', () => {
    expect(formatLegalContent('')).toBe('')
  })

  it('converts ## heading to <h2>', () => {
    const result = formatLegalContent('## My Title')
    expect(result).toContain('<h2')
    expect(result).toContain('My Title')
    expect(result).not.toContain('## My Title')
  })

  it('converts ### heading to <h3>', () => {
    const result = formatLegalContent('### Sub Title')
    expect(result).toContain('<h3')
    expect(result).toContain('Sub Title')
  })

  it('converts **bold** to <strong>', () => {
    const result = formatLegalContent('Some **important** text')
    expect(result).toContain('<strong class="font-semibold">important</strong>')
  })

  it('converts URLs to links with noopener noreferrer', () => {
    const result = formatLegalContent('Visit https://example.com for details')
    expect(result).toContain('href="https://example.com"')
    expect(result).toContain('target="_blank"')
    expect(result).toContain('rel="noopener noreferrer"')
  })

  it('converts - list items to <li> wrapped in <ul>', () => {
    const result = formatLegalContent('- first\n- second')
    expect(result).toContain('<li class="ml-4">first</li>')
    expect(result).toContain('<li class="ml-4">second</li>')
    expect(result).toContain('<ul')
  })

  it('wraps plain text in <p>', () => {
    const result = formatLegalContent('Hello world')
    expect(result).toContain('<p')
    expect(result).toContain('Hello world')
  })

  it('does not emit empty <p> tags', () => {
    const result = formatLegalContent('Line one\n\nLine two')
    expect(result).not.toMatch(/<p[^>]*><\/p>/)
  })

  it('headings are not wrapped inside a <p>', () => {
    const result = formatLegalContent('## Section')
    expect(result).not.toMatch(/<p[^>]*><h2/)
  })
})
