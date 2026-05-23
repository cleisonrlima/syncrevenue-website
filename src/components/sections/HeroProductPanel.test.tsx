import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import HeroProductPanel from './HeroProductPanel'
import '@/i18n'

// Allow individual tests to stub useReducedMotion.
const reducedMotionRef = { current: false }
vi.mock('motion/react', async () => {
  const actual = await vi.importActual<typeof import('motion/react')>('motion/react')
  return {
    ...actual,
    useReducedMotion: () => reducedMotionRef.current,
  }
})

describe('HeroProductPanel (Story 6.4)', () => {
  beforeEach(() => {
    reducedMotionRef.current = false
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders the panel head with mark, tag, and product name', () => {
    render(<HeroProductPanel />)
    expect(screen.getByTestId('hero-product-panel')).toBeInTheDocument()
    expect(screen.getByTestId('hero-panel-mark')).toBeInTheDocument()
    expect(screen.getByText('SyncRevenue')).toBeInTheDocument()
    // Eyebrow tag has SYNC SIRIUS prefix in every locale
    expect(screen.getByText(/^SYNC SIRIUS/i)).toBeInTheDocument()
  })

  it('renders the panel line with a <strong> emphasis slot via <Trans>', () => {
    render(<HeroProductPanel />)
    const panel = screen.getByTestId('hero-product-panel')
    const strongs = panel.querySelectorAll('p strong')
    expect(strongs.length).toBeGreaterThanOrEqual(1)
    expect(strongs[0].textContent).toMatch(/mid-office/i)
  })

  it('renders three integration tiles each with a live green dot', () => {
    render(<HeroProductPanel />)
    const row = screen.getByTestId('hero-ints-row')
    expect(row.children.length).toBe(3)

    expect(screen.getByTestId('hero-int-amadeus')).toBeInTheDocument()
    expect(screen.getByTestId('hero-int-sabre')).toBeInTheDocument()
    expect(screen.getByTestId('hero-int-travelport')).toBeInTheDocument()

    expect(screen.getByTestId('hero-int-amadeus-live')).toBeInTheDocument()
    expect(screen.getByTestId('hero-int-sabre-live')).toBeInTheDocument()
    expect(screen.getByTestId('hero-int-travelport-live')).toBeInTheDocument()

    // Travelport tile carries the Galileo · Worldspan subtitle
    const travelport = screen.getByTestId('hero-int-travelport')
    expect(travelport.textContent).toMatch(/Galileo · Worldspan/)
  })

  it('renders bundled official wordmark images for all integration tiles', () => {
    render(<HeroProductPanel />)

    const expected = [
      ['hero-int-amadeus', 'Amadeus', '/integrations/amadeus.png'],
      ['hero-int-sabre', 'Sabre', '/integrations/sabre.svg'],
      ['hero-int-travelport', 'Travelport', '/integrations/travelport.svg'],
    ] as const

    for (const [testId, alt, src] of expected) {
      const tile = screen.getByTestId(testId)
      const img = tile.querySelector('img')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('alt', alt)
      expect(img).toHaveAttribute('src', src)
      expect(img).toHaveAttribute('loading', 'eager')
      expect(img?.className).toContain('max-h-[22px]')
      expect(img?.className).toContain('object-contain')
    }
  })

  it('renders the "also supported" chips with whitespace-nowrap (NDC + Custom IBE)', () => {
    render(<HeroProductPanel />)
    const panel = screen.getByTestId('hero-product-panel')
    const ndcChip = panel.querySelector('.whitespace-nowrap')!
    expect(ndcChip).toBeInTheDocument()
    expect(panel.textContent).toMatch(/NDC/)
  })

  describe('ticker', () => {
    it('renders the first entry initially and is wrapped in aria-live=polite', () => {
      render(<HeroProductPanel />)
      const ticker = screen.getByTestId('hero-ticker')
      expect(ticker.getAttribute('aria-live')).toBe('polite')
      expect(screen.getByTestId('hero-ticker-label').textContent).toMatch(/PNR-44128/)
      expect(screen.getByTestId('hero-ticker-value').textContent).toMatch(/\$8,420/)
    })

    it('cycles to the next entry after 8s + 200ms fade tick', () => {
      vi.useFakeTimers()
      render(<HeroProductPanel />)
      expect(screen.getByTestId('hero-ticker-label').textContent).toMatch(/PNR-44128/)

      // Advance through the cycle interval + the inner fade timeout
      act(() => {
        vi.advanceTimersByTime(8000)
      })
      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(screen.getByTestId('hero-ticker-label').textContent).toMatch(/PNR-92710/)
    })

    it('clears the pending fade timeout when unmounted mid-transition', () => {
      vi.useFakeTimers()
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
      const { unmount } = render(<HeroProductPanel />)

      act(() => {
        vi.advanceTimersByTime(8000)
      })

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(200)
      })
    })

    it('does not cycle when prefers-reduced-motion is set', () => {
      reducedMotionRef.current = true
      vi.useFakeTimers()
      render(<HeroProductPanel />)
      expect(screen.getByTestId('hero-ticker-label').textContent).toMatch(/PNR-44128/)

      act(() => {
        vi.advanceTimersByTime(24_000)
      })

      // Still on the first entry — no cycling under reduced motion
      expect(screen.getByTestId('hero-ticker-label').textContent).toMatch(/PNR-44128/)
    })
  })
})
