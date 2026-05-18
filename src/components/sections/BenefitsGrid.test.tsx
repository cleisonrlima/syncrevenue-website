import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import BenefitsGrid from './BenefitsGrid'
import i18next from '@/i18n'

describe('BenefitsGrid (Story 6.5)', () => {
  afterEach(async () => {
    cleanup()
    await i18next.changeLanguage('en')
  })

  it('renders the grid wrapper with the #beneficios anchor for navbar deep-link', () => {
    render(<BenefitsGrid />)
    const grid = screen.getByTestId('benefits-grid')
    expect(grid).toBeInTheDocument()
    expect(grid.getAttribute('id')).toBe('beneficios')
  })

  it('renders exactly 6 benefit cards', () => {
    render(<BenefitsGrid />)
    for (const k of ['0', '1', '2', '3', '4', '5']) {
      expect(screen.getByTestId(`benefit-card-${k}`)).toBeInTheDocument()
    }
  })

  it('renders both metric variants (neutral + blue) on at least one card each', () => {
    render(<BenefitsGrid />)
    expect(screen.getAllByTestId('benefits-metric-neutral').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByTestId('benefits-metric-blue').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the canonical English titles in the default locale', () => {
    render(<BenefitsGrid />)
    expect(screen.getByText('Correct commission on issuance')).toBeInTheDocument()
    expect(screen.getByText('GDS, NDC, and IBE — agnostic')).toBeInTheDocument()
    expect(screen.getByText('Contract management')).toBeInTheDocument()
    expect(screen.getByText('Immediate ROI')).toBeInTheDocument()
    expect(screen.getByText('Fewer disputes, fewer ADMs')).toBeInTheDocument()
    expect(screen.getByText('Analytics to negotiate')).toBeInTheDocument()
  })

  it('updates titles when locale switches to pt-BR', async () => {
    render(<BenefitsGrid />)
    await i18next.changeLanguage('pt-BR')
    expect(await screen.findByText('Comissão correta na emissão')).toBeInTheDocument()
    expect(screen.getByText('Analytics para negociar')).toBeInTheDocument()
  })

  it('cards use <article> with <h3> titles for proper heading hierarchy', () => {
    render(<BenefitsGrid />)
    const card0 = screen.getByTestId('benefit-card-0')
    expect(card0.tagName).toBe('ARTICLE')
    const h3 = card0.querySelector('h3')
    expect(h3).toBeInTheDocument()
  })
})
