import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SectionHeader from './SectionHeader'

describe('SectionHeader', () => {
  it('renders an h2 by default', () => {
    render(<SectionHeader eyebrow="EYEBROW" heading="Title" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Title' })).toBeInTheDocument()
  })

  it('renders an h3 when as="h3"', () => {
    render(<SectionHeader eyebrow="EYEBROW" heading="Title" as="h3" />)
    expect(screen.getByRole('heading', { level: 3, name: 'Title' })).toBeInTheDocument()
  })

  it('renders subtext only when provided', () => {
    const { rerender } = render(<SectionHeader eyebrow="EYE" heading="Title" />)
    expect(screen.queryByText('Some subtext')).not.toBeInTheDocument()

    rerender(<SectionHeader eyebrow="EYE" heading="Title" subtext="Some subtext" />)
    expect(screen.getByText('Some subtext')).toBeInTheDocument()
  })

  it('applies the dark variant class on the heading when variant="dark"', () => {
    render(<SectionHeader eyebrow="EYE" heading="Dark Title" variant="dark" />)
    const heading = screen.getByRole('heading', { level: 2, name: 'Dark Title' })
    expect(heading.className).toContain('text-white')
  })

  it('forwards headingId to the rendered heading element', () => {
    render(<SectionHeader eyebrow="EYE" heading="Identified" headingId="section-foo" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Identified' })).toHaveAttribute(
      'id',
      'section-foo',
    )
  })
})
