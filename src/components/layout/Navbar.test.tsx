import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'
import '@/i18n'

const NAV_LABEL_REGEX = {
  produto: /^Product$/i,
  beneficios: /^Benefits$/i,
  integracoes: /^Integrations$/i,
  seguranca: /^Security$/i,
  clientes: /^Clients$/i,
  contato: /^Contact$/i,
} as const

describe('Navbar', () => {
  const renderNavbar = (initialRoute = '/') =>
    render(<Navbar />, { wrapper: ({ children }) => <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter> })

  it('hamburger button exists with aria-expanded false initially', () => {
    renderNavbar()
    const btn = screen.getByRole('button', { name: /open menu/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking hamburger opens overlay', async () => {
    const user = userEvent.setup()
    renderNavbar()
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute('aria-expanded', 'true')
  })

  it('pressing Escape closes the overlay', async () => {
    const user = userEvent.setup()
    renderNavbar()
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking a nav link in overlay closes the overlay', async () => {
    const user = userEvent.setup()
    renderNavbar()
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    const overlay = screen.getByRole('navigation', { name: /mobile navigation/i })
    const overlayFirstLink = within(overlay).getByRole('link', { name: NAV_LABEL_REGEX.produto })
    await user.click(overlayFirstLink)
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking the overlay backdrop closes the overlay and returns focus to the hamburger', async () => {
    const user = userEvent.setup()
    renderNavbar()
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    const backdrop = screen.getByTestId('mobile-overlay-backdrop')
    await user.click(backdrop)
    const reopenedTrigger = screen.getByRole('button', { name: /open menu/i })
    expect(reopenedTrigger).toHaveAttribute('aria-expanded', 'false')
    expect(reopenedTrigger).toHaveFocus()
  })

  it('clicking inside the overlay content panel does not close the overlay', async () => {
    const user = userEvent.setup()
    renderNavbar()
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    const content = screen.getByTestId('mobile-overlay-content')
    await user.click(content)
    expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute('aria-expanded', 'true')
  })

  describe('Story 6.2 — six anchor links', () => {
    it('desktop nav surfaces six anchor links with i18n labels and correct hrefs', () => {
      renderNavbar()
      // Each link appears twice (desktop + mobile-overlay markup). We assert
      // the desktop set by filtering on aria context, but the simpler
      // signal-preserving check is to assert at least one link with each
      // expected href.
      const expected = [
        ['Product', '#produto'],
        ['Benefits', '#beneficios'],
        ['Integrations', '#integracoes'],
        ['Security', '#seguranca'],
        ['Clients', '#clientes'],
        ['Contact', '#contato'],
      ] as const
      for (const [label, href] of expected) {
        const links = screen.getAllByRole('link', { name: new RegExp(`^${label}$`, 'i') })
        expect(links.length).toBeGreaterThanOrEqual(1)
        expect(links.some(l => l.getAttribute('href') === href)).toBe(true)
      }
    })

    it('routes section links back to the landing page from sub-routes', () => {
      renderNavbar('/privacy')
      const productLinks = screen.getAllByRole('link', { name: NAV_LABEL_REGEX.produto })
      expect(productLinks.some(l => l.getAttribute('href') === '/#produto')).toBe(true)
    })

    it('mobile overlay surfaces the same six anchor links plus a Demo CTA link', async () => {
      const user = userEvent.setup()
      renderNavbar()
      await user.click(screen.getByRole('button', { name: /open menu/i }))
      const overlay = screen.getByRole('navigation', { name: /mobile navigation/i })
      for (const label of Object.values(NAV_LABEL_REGEX)) {
        expect(within(overlay).getByRole('link', { name: label })).toBeInTheDocument()
      }
      const demoCtaLink = within(overlay).getByRole('link', { name: /schedule a demo/i })
      expect(demoCtaLink).toHaveAttribute('href', '/#agendar-demo')
    })

    it('mobile overlay routes section links back to the landing page from sub-routes', async () => {
      const user = userEvent.setup()
      renderNavbar('/privacy')
      await user.click(screen.getByRole('button', { name: /open menu/i }))
      const overlay = screen.getByRole('navigation', { name: /mobile navigation/i })
      expect(within(overlay).getByRole('link', { name: NAV_LABEL_REGEX.produto })).toHaveAttribute(
        'href',
        '/#produto',
      )
    })
  })

  describe('Story 6.2 — overlay-at-top vs. sticky transition', () => {
    afterEach(() => {
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    })

    it('renders transparent overlay state on the home route at scroll-y = 0', () => {
      renderNavbar('/')
      const root = screen.getByTestId('navbar-root')
      expect(root.getAttribute('data-overlay')).toBe('true')
      expect(root.className).toContain('bg-transparent')
      expect(root.className).not.toMatch(/backdrop-blur-md/)
    })

    it('switches to sticky filled state once scroll exceeds the threshold', async () => {
      renderNavbar('/')
      const root = screen.getByTestId('navbar-root')
      expect(root.getAttribute('data-overlay')).toBe('true')

      act(() => {
        Object.defineProperty(window, 'scrollY', { configurable: true, value: 1200 })
        window.dispatchEvent(new Event('scroll'))
      })

      // Wait one rAF tick — the listener throttles via requestAnimationFrame.
      await new Promise(r => requestAnimationFrame(() => r(null)))

      expect(root.getAttribute('data-overlay')).toBe('false')
      expect(root.className).toContain('backdrop-blur-md')
    })

    it('renders the filled state on non-home routes regardless of scroll position', () => {
      renderNavbar('/privacy')
      const root = screen.getByTestId('navbar-root')
      expect(root.getAttribute('data-overlay')).toBe('false')
      expect(root.className).toContain('backdrop-blur-md')
    })
  })

  describe('Story 6.2 / 6.10 — primary CTA (Schedule a Demo)', () => {
    let scrollTargets: HTMLElement[]
    let stubSection: HTMLElement

    beforeEach(() => {
      scrollTargets = []
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
        configurable: true,
        writable: true,
        value: function (this: HTMLElement) {
          scrollTargets.push(this)
        },
      })
      stubSection = document.createElement('section')
      stubSection.id = 'agendar-demo'
      document.body.appendChild(stubSection)
    })

    afterEach(() => {
      stubSection.remove()
      vi.restoreAllMocks()
    })

    it('uses the solid-accent Button variant (Epic 6 sober palette)', () => {
      renderNavbar()
      const cta = screen.getByRole('button', { name: /schedule a demo/i })
      // solid-accent fingerprint (from Story 6.1 Button.tsx)
      expect(cta.className).toContain('bg-[var(--accent)]')
      expect(cta.className).not.toMatch(/bg-gradient-/)
    })

    it('scrolls to #agendar-demo when the CTA is clicked', async () => {
      const user = userEvent.setup()
      renderNavbar()
      const cta = screen.getByRole('button', { name: /schedule a demo/i })
      await user.click(cta)
      expect(scrollTargets).toContain(stubSection)
    })

    it('does not look for the retired #demo-scheduler id (Story 6.10 fallback removed)', async () => {
      const user = userEvent.setup()
      // Drop the new target so only the legacy one exists — CTA must NOT scroll there.
      stubSection.remove()
      const legacy = document.createElement('section')
      legacy.id = 'demo-scheduler'
      document.body.appendChild(legacy)
      try {
        renderNavbar()
        const cta = screen.getByRole('button', { name: /schedule a demo/i })
        await user.click(cta)
        expect(scrollTargets).not.toContain(legacy)
      } finally {
        legacy.remove()
        document.body.appendChild(stubSection)
      }
    })
  })

  describe('Story 6.2 — logo asset', () => {
    it('renders the SyncSirius logo with explicit width/height (CLS prevention)', () => {
      renderNavbar()
      const logo = screen.getByAltText('SyncSirius') as HTMLImageElement
      expect(logo.getAttribute('src')).toBe('/syncsirius-logo-trans.png')
      expect(logo.getAttribute('width')).toBe('32')
      expect(logo.getAttribute('height')).toBe('32')
      expect(logo.getAttribute('loading')).toBe('eager')
      expect(logo.closest('a')).toHaveAttribute('href', '#')
    })
  })
})
