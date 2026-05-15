import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import ClientReferences from './ClientReferences'

const references = [
  {
    agencyName: 'Approved Travel Partners',
    location: 'Miami, FL',
    relationship: 'SyncRevenue reference customer',
    testimonial:
      'SyncRevenue gave our finance team a clearer commission reconciliation trail across BSP and ARC reporting.',
  },
  {
    agencyName: 'Northstar Agency Group',
    location: 'Dallas, TX',
    relationship: 'Operations reference',
    referenceDetail: 'Available for security and implementation reference calls after mutual approval.',
  },
]

const tMock = vi.fn(
  (key: string, options?: { defaultValue?: string; returnObjects?: boolean }): unknown => {
    if (key === 'references.items' && options?.returnObjects) {
      return references
    }

    return options?.defaultValue ?? key
  },
)

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: tMock }),
}))

describe('ClientReferences', () => {
  beforeEach(() => {
    tMock.mockClear()
  })

  it('renders a named references region with the correct id', () => {
    render(<ClientReferences />)

    const section = screen.getByRole('region', {
      name: 'Verified US travel agency references',
    })

    expect(section).toHaveAttribute('id', 'client-references')
  })

  it('renders SectionHeader copy from i18n keys', () => {
    render(<ClientReferences />)

    expect(screen.getByText('Client References')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Trusted by US Travel Agencies' })).toBeInTheDocument()
    expect(screen.getByText(/Named references are shared with approval/)).toBeInTheDocument()
  })

  it('renders named agency references with verifiable details', () => {
    render(<ClientReferences />)

    references.forEach(reference => {
      const card = screen.getByRole('article', { name: reference.agencyName })

      expect(within(card).getByRole('heading', { name: reference.agencyName })).toBeInTheDocument()
      expect(within(card).getByText(reference.location)).toBeInTheDocument()
      expect(within(card).getByText(reference.relationship)).toBeInTheDocument()
    })

    expect(screen.getByText(/clearer commission reconciliation trail/)).toBeInTheDocument()
    expect(screen.getByText(/security and implementation reference calls/)).toBeInTheDocument()
  })

  it('normalizes bad translation data without crashing or rendering incomplete cards', () => {
    tMock.mockImplementationOnce((key: string, options?: { defaultValue?: string; returnObjects?: boolean }) => {
      if (key === 'references.ariaLabel') {
        return options?.defaultValue ?? key
      }

      if (key === 'references.items' && options?.returnObjects) {
        return [
          references[0],
          { agencyName: 'Missing Details' },
          'invalid reference',
          { agencyName: 'Missing Testimonial', location: 'Boston, MA', relationship: 'Reference' },
        ]
      }

      return options?.defaultValue ?? key
    })

    render(<ClientReferences />)

    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByRole('article', { name: 'Approved Travel Partners' })).toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'Missing Details' })).not.toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'Missing Testimonial' })).not.toBeInTheDocument()
  })

  it('does not render vague fallback reference patterns as production copy', () => {
    const { container } = render(<ClientReferences />)
    const renderedCopy = container.textContent ?? ''

    expect(renderedCopy).not.toMatch(/a leading TMC/i)
    expect(renderedCopy).not.toMatch(/recognized agency/i)
  })

  it('uses translation keys for visible section copy and references data', () => {
    render(<ClientReferences />)

    const usedKeys = tMock.mock.calls.map(([key]) => key)
    expect(usedKeys).toEqual(
      expect.arrayContaining([
        'references.ariaLabel',
        'references.eyebrow',
        'references.headline',
        'references.subtext',
        'references.items',
      ]),
    )
  })
})
