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
    <MemoryRouter initialEntries={['/v2']}>
      <Landing />
    </MemoryRouter>,
  )

describe('Landing (Story 7.4 — /v2)', () => {
  it('renders without crashing under MemoryRouter', () => {
    expect(() => renderLanding()).not.toThrow()
  })

  it('renders the first-slide hero h1 verbatim from the Figma source', () => {
    renderLanding()
    // The first slide's h1 starts with "Recover lost revenue." followed by a
    // <br/> + the gradient "Instantly." highlight. The text query matches the
    // accessible name (which collapses the <br/> and concatenates the runs).
    const heading = screen.getByRole('heading', { level: 1, name: /Recover lost revenue\./i })
    expect(heading).toBeInTheDocument()
  })

  it('renders the trust strip with the verbatim Figma marketing copy', () => {
    renderLanding()
    expect(screen.getByText(/TRUSTED BY FORWARD-THINKING AGENCIES/)).toBeInTheDocument()
  })

  it('routes the primary nav "Book a Demo" CTA to /demo', () => {
    renderLanding()
    // The nav has a desktop "Book a Demo" link AND the mobile menu has one.
    // Both should point to /demo. We assert at least one such anchor exists
    // with the right href (avoids brittle "desktop vs mobile" forking).
    const bookDemoLinks = screen
      .getAllByRole('link', { name: /Book a Demo/i })
      .filter((el) => el.getAttribute('href') === '/demo')
    expect(bookDemoLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the benefits grid section heading from the Figma port', () => {
    renderLanding()
    expect(
      screen.getByRole('heading', { level: 2, name: /Automate the invisible\./i }),
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
    expect(screen.getByRole('link', { name: /Contact Support/i })).toHaveAttribute('href', '/#contato')
  })
})
