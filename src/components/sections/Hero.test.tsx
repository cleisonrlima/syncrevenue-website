import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Hero from './Hero'
import '@/i18n'

describe('Hero (Story 6.3 sober rebuild)', () => {
  const renderHero = () => render(<Hero />, { wrapper: MemoryRouter })

  it('renders hero section with the canonical id', () => {
    renderHero()
    const section = screen.getByRole('region')
    expect(section).toHaveAttribute('id', 'hero')
  })

  it('renders a two-line H1 with the accent span on line 2', () => {
    renderHero()
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveAttribute('id', 'hero-heading')
    // Line 1 text — plain white
    expect(h1.textContent).toMatch(/More commission per ticket\./)
    // Line 2 — wrapped in accent span (var(--accent-soft))
    const accentSpan = within(h1).getByTestId('hero-headline-accent')
    expect(accentSpan.tagName).toBe('SPAN')
    expect(accentSpan.textContent).toMatch(/Less rework at the rate desk\./)
    expect(accentSpan.className).toContain('text-[var(--accent-soft)]')
  })

  it('renders the sub paragraph with <strong> slots via <Trans>', () => {
    renderHero()
    const strongs = document.querySelectorAll('section#hero p strong')
    expect(strongs.length).toBeGreaterThanOrEqual(2)
    expect(strongs[0].textContent).toMatch(/SyncRevenue/)
    expect(strongs[1].textContent).toMatch(/before ticketing/)
  })

  describe('CTA row', () => {
    it('renders exactly one primary solid-accent button and one tertiary text link', () => {
      renderHero()
      const primary = screen.getByTestId('hero-primary-cta')
      expect(primary.tagName).toBe('BUTTON')
      expect(primary.className).toContain('bg-[var(--accent)]')
      expect(primary.className).not.toMatch(/bg-gradient-/)
      expect(primary.textContent).toMatch(/Schedule a Demo/)

      const secondary = screen.getByTestId('hero-secondary-link')
      expect(secondary.tagName).toBe('A')
      expect(secondary.getAttribute('href')).toBe('#beneficios')
      expect(secondary.textContent).toMatch(/See how it works/)
    })
  })

  describe('Primary CTA scroll fallback chain', () => {
    let scrollTargets: HTMLElement[]
    let demoSchedulerStub: HTMLElement

    beforeEach(() => {
      scrollTargets = []
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
        configurable: true,
        writable: true,
        value: function (this: HTMLElement) {
          scrollTargets.push(this)
        },
      })
      demoSchedulerStub = document.createElement('section')
      demoSchedulerStub.id = 'demo-scheduler'
      document.body.appendChild(demoSchedulerStub)
    })

    afterEach(() => {
      demoSchedulerStub.remove()
      vi.restoreAllMocks()
    })

    it('falls back to #demo-scheduler when #agendar-demo is absent', async () => {
      const user = userEvent.setup()
      renderHero()
      await user.click(screen.getByTestId('hero-primary-cta'))
      expect(scrollTargets).toContain(demoSchedulerStub)
    })

    it('prefers #agendar-demo when present', async () => {
      const user = userEvent.setup()
      const newTarget = document.createElement('section')
      newTarget.id = 'agendar-demo'
      document.body.appendChild(newTarget)
      try {
        renderHero()
        await user.click(screen.getByTestId('hero-primary-cta'))
        expect(scrollTargets).toContain(newTarget)
        expect(scrollTargets).not.toContain(demoSchedulerStub)
      } finally {
        newTarget.remove()
      }
    })
  })

  describe('Background + overlay scrim', () => {
    it('renders the airplane background div with the local asset URL and saturate filter', () => {
      renderHero()
      const bg = screen.getByTestId('hero-bg')
      const inlineStyle = bg.getAttribute('style') ?? ''
      expect(inlineStyle).toMatch(/url\(['"]?\/hero\/airplane\.jpg['"]?\)/)
      expect(inlineStyle).toMatch(/saturate\(0\.85\)/)
    })
  })

  describe('KPI strip', () => {
    it('renders three KPI columns with tabular-nums values', () => {
      renderHero()
      const row = screen.getByTestId('hero-kpi-row')
      const cols = row.children
      expect(cols.length).toBe(3)

      expect(cols[0].textContent).toMatch(/\+15–20%/)
      expect(cols[0].textContent).toMatch(/Commission/)
      expect(cols[0].textContent).toMatch(/recovered/)

      expect(cols[1].textContent).toMatch(/−40%/)
      expect(cols[1].textContent).toMatch(/Debit memos/)

      expect(cols[2].textContent).toMatch(/−65%/)
      expect(cols[2].textContent).toMatch(/QC/)

      // First value uses tabular-nums for digit-width stability
      const firstValue = cols[0].querySelector(':first-child')!
      expect(firstValue.className).toContain('tabular-nums')
    })

    it('renders a top border hairline that uses the new --line token', () => {
      renderHero()
      const row = screen.getByTestId('hero-kpi-row')
      expect(row.className).toContain('border-t')
      expect(row.className).toContain('border-[var(--line)]')
    })
  })

  describe('TrustBar preservation (refactored in Story 6.5)', () => {
    it('keeps the TrustBar rendering 4 trust items (now in a single wrap row)', () => {
      renderHero()
      const allSvgs = document.querySelectorAll('svg[aria-label="verified"]')
      // Single row now — 4 verified ticks total (no responsive duplication)
      expect(allSvgs.length).toBe(4)
    })
  })

  describe('BenefitsGrid mount (Story 6.5)', () => {
    it('mounts the 6-card benefits grid with #beneficios anchor inside Hero', () => {
      renderHero()
      const grid = screen.getByTestId('benefits-grid')
      expect(grid).toBeInTheDocument()
      expect(grid.getAttribute('id')).toBe('beneficios')
    })
  })

  describe('Right column — product panel (Story 6.4)', () => {
    it('mounts HeroProductPanel inside the right column', () => {
      renderHero()
      const right = screen.getByTestId('hero-right-column')
      expect(right).toBeInTheDocument()
      expect(screen.getByTestId('hero-product-panel')).toBeInTheDocument()
    })
  })
})
