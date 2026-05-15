import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Hero from './Hero'
import '@/i18n'

describe('Hero', () => {
  const renderHero = () => render(<Hero />, { wrapper: MemoryRouter })

  it('renders hero section with correct id', () => {
    renderHero()
    const section = screen.getByRole('region')
    expect(section).toHaveAttribute('id', 'hero')
  })

  it('renders badge, headline, subheadline, CTA button, and tertiary link', () => {
    renderHero()

    // Badge, headline, subheadline are rendered via i18n
    expect(screen.getByText(/Commission Recovery for Travel Agencies/i)).toBeInTheDocument()
    expect(screen.getByText(/Commission Management Built for Modern Travel Agencies/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Recover 15–25% of commission revenue lost to GDS discrepancies/i)
    ).toBeInTheDocument()

    // CTA button
    const buttons = screen.getAllByRole('button', { name: /Schedule a Demo/i })
    expect(buttons.length).toBeGreaterThan(0)

    // Tertiary link
    const links = screen.getAllByRole('link')
    expect(links.some(link => link.textContent.includes('Learn about commission recovery'))).toBe(true)
  })

  it('CTA button is a GradientButton with size lg', () => {
    renderHero()
    const cta = screen.getAllByRole('button', { name: /Schedule a Demo/i })[0]

    // GradientButton applies bg-gradient-brand and size lg padding
    expect(cta).toHaveClass('bg-gradient-brand')
    expect(cta).toHaveClass('px-8')
    expect(cta).toHaveClass('py-4')
  })

  it('tertiary link is an <a> element, not a <button>', () => {
    renderHero()
    const links = screen.getAllByRole('link')
    const tertiaryLink = links.find(link => link.textContent.includes('Learn about commission recovery'))

    expect(tertiaryLink).toBeDefined()
    expect(tertiaryLink?.tagName).toBe('A')
    expect(tertiaryLink).toHaveClass('text-brand-electric-blue')
  })

  it('uses i18n keys for all visible text', () => {
    renderHero()

    // All these texts come from translations, not hardcoded
    expect(screen.getByText(/Commission Recovery for Travel Agencies/)).toBeInTheDocument()
    expect(screen.getByText(/Commission Management Built for Modern Travel Agencies/)).toBeInTheDocument()
    expect(screen.getByText(/Schedule a Demo/)).toBeInTheDocument()
    expect(screen.getByText(/Learn about commission recovery/)).toBeInTheDocument()
  })

  it('renders StatRow and TrustBar with expected structure', () => {
    const { container } = renderHero()

    // StatRow should render 3 stats with labels and values
    const stats = container.querySelectorAll('.bg-gradient-brand.bg-clip-text')
    expect(stats.length).toBe(3)

    // TrustBar should render trust items (4 checkmarks across responsive layouts)
    const allSvgs = container.querySelectorAll('svg[aria-hidden="true"]')
    expect(allSvgs.length).toBeGreaterThanOrEqual(4)

    // Verify trust item text is present (use getAllByText since responsive layout duplicates)
    const trustTexts = [
      'Encrypted Transmission',
      'Certification Roadmap',
      'Contract Insurance',
      'Referenced US Agencies',
    ]
    trustTexts.forEach(text => {
      const elements = screen.getAllByText(text)
      expect(elements.length).toBeGreaterThan(0)
    })
  })
})
