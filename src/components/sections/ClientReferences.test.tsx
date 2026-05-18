import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import ClientReferences from './ClientReferences'
import i18next from '@/i18n'

describe('ClientReferences (Story 6.6 sober refresh)', () => {
  afterEach(async () => {
    cleanup()
    await i18next.changeLanguage('en')
  })

  it('renders a named region with the #clientes anchor (Story 6.2 deep-link target)', () => {
    render(<ClientReferences />)
    const region = screen.getByRole('region', {
      name: 'Verified US travel agency references',
    })
    expect(region).toHaveAttribute('id', 'clientes')
  })

  it('renders the eyebrow + heading + accent span', () => {
    render(<ClientReferences />)
    expect(screen.getByText('Client References')).toBeInTheDocument()
    const accent = screen.getByTestId('references-accent')
    expect(accent.tagName).toBe('SPAN')
    expect(accent.textContent).toMatch(/agencies/i)
    expect(accent.className).toContain('text-[var(--accent-soft)]')
  })

  it('renders three quote cards with sober monogram (neutral fill — no per-brand gradient)', () => {
    render(<ClientReferences />)
    const grid = screen.getByTestId('quotes-grid')
    expect(grid.children.length).toBe(3)
    for (let i = 0; i < 3; i++) {
      const card = screen.getByTestId(`quote-card-${i}`)
      expect(card).toBeInTheDocument()
      expect(card.className).not.toMatch(/bg-gradient-/)
    }
  })

  it('Pacific Sun Voyages card uses the muted pill variant + italic body', () => {
    render(<ClientReferences />)
    const card = screen.getByTestId('quote-card-1')
    expect(within(card).getByText('Pacific Sun Voyages')).toBeInTheDocument()
    const body = screen.getByTestId('quote-body-1')
    expect(body.className).toContain('italic')
  })

  it('the other two cards use the default pill variant (no italic body)', () => {
    render(<ClientReferences />)
    expect(screen.getByTestId('quote-body-0').className).not.toContain('italic')
    expect(screen.getByTestId('quote-body-2').className).not.toContain('italic')
  })

  it('renders the ghost CTA linking to #contato', () => {
    render(<ClientReferences />)
    const cta = screen.getByTestId('ref-cta').querySelector('a')!
    expect(cta).toBeInTheDocument()
    expect(cta.getAttribute('href')).toBe('#contato')
    expect(cta.textContent).toMatch(/Request References/i)
  })

  it('preserves the canonical agency names (allowlist invariant Story 1.9 R-B1)', () => {
    render(<ClientReferences />)
    expect(screen.getByText('Atlas Travel Group')).toBeInTheDocument()
    expect(screen.getByText('Pacific Sun Voyages')).toBeInTheDocument()
    expect(screen.getByText('Northstar Travel Partners')).toBeInTheDocument()
  })
})
