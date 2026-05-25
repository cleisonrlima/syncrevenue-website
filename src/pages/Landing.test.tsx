import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import '@/i18n'

/**
 * Story 7.4 (AC 7): smoke tests for the verbatim Figma Landing port mounted
 * at `/v2` (`src/pages/Landing.tsx`).
 *
 * Mock strategy:
 *
 *   - `react-slick`: mocked locally. Even though `src/test/setup.ts` ships a
 *     `matchMedia` polyfill that lets the real react-slick module load, the
 *     real slider initialises against `window` measurements that jsdom does
 *     not provide and its autoplay setInterval keeps timers alive past the
 *     test boundary. The mock renders all children eagerly as a plain `<div>`
 *     wrapper. AC 7 (b) asserts the FIRST slide's h1 — which this naive
 *     render is sufficient to satisfy because all 3 slides are present in
 *     the DOM at once.
 *
 *   - `motion/react`: the global `src/test/setup.ts` mock now covers
 *     `motion.<tag>`, `AnimatePresence`, `useScroll`, and `useTransform`
 *     (the latter three were added in Story 7.4 to unblock Landing — see
 *     setup.ts comments). No local mock needed.
 */

vi.mock('react-slick', () => {
  return {
    default: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="mock-slick-slider">{children}</div>
    ),
  }
})

import Landing from './Landing'

const renderLanding = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Landing />
    </MemoryRouter>,
  )

describe('Landing (main page — /)', () => {
  it('renders without crashing under MemoryRouter', () => {
    expect(() => renderLanding()).not.toThrow()
  })

  it('renders the hero h1', () => {
    renderLanding()
    const heading = screen.getByRole('heading', { level: 1, name: /More commission per ticket/i })
    expect(heading).toBeInTheDocument()
  })

  it('renders the trust strip', () => {
    renderLanding()
    expect(screen.getByTestId('trust-bar')).toBeInTheDocument()
  })

  it('surfaces a "Schedule a Demo" CTA in the navigation', () => {
    renderLanding()
    // The section-based landing uses Navbar with a button CTA that scrolls to the
    // embedded demo section. At least one "Schedule a Demo" button must be present.
    const ctaButtons = screen.getAllByRole('button', { name: /Schedule a Demo/i })
    expect(ctaButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the benefits grid section heading', () => {
    renderLanding()
    expect(
      screen.getByRole('heading', { level: 2, name: /Why agencies pick SyncRevenue/i }),
    ).toBeInTheDocument()
  })

  it('opens the mobile menu as a dialog and closes it with Escape', async () => {
    const user = userEvent.setup()
    renderLanding()
    await user.click(screen.getByRole('button', { name: /Open menu/i }))
    expect(screen.getByRole('dialog', { name: /Landing navigation/i })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /Landing navigation/i })).not.toBeInTheDocument()
  })

  it('renders footer links with real destinations', () => {
    renderLanding()
    expect(screen.getByRole('link', { name: /Privacy Policy/i })).toHaveAttribute('href', '/privacy')
    expect(screen.getByRole('link', { name: /Terms of Service/i })).toHaveAttribute(
      'href',
      '/privacy#terms',
    )
    expect(screen.getByRole('link', { name: /Contact Support/i })).toHaveAttribute('href', '#contato')
  })
})
