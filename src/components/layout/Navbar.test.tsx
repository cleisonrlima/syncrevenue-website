import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'
import '@/i18n'

describe('Navbar', () => {
  const renderNavbar = () => render(<Navbar />, { wrapper: MemoryRouter })

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
    const overlayHomeLink = within(overlay).getByRole('link', { name: /home/i })
    await user.click(overlayHomeLink)
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

  describe('Story 2.4 — Demo CTA convergence on #demo-scheduler', () => {
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
      stubSection.id = 'demo-scheduler'
      document.body.appendChild(stubSection)
    })

    afterEach(() => {
      stubSection.remove()
      vi.restoreAllMocks()
    })

    it('desktop nav.demo CTA scrolls to the #demo-scheduler section', async () => {
      const user = userEvent.setup()
      renderNavbar()

      const desktopCta = screen.getByRole('button', { name: /request demo/i })
      const originalHash = window.location.hash
      await user.click(desktopCta)

      expect(scrollTargets).toContain(stubSection)
      expect(window.location.hash).toBe(originalHash)
    })

    it('mobile menu exposes the /#demo-scheduler anchor for the demo CTA', async () => {
      const user = userEvent.setup()
      renderNavbar()
      await user.click(screen.getByRole('button', { name: /open menu/i }))
      const overlay = screen.getByRole('navigation', { name: /mobile navigation/i })
      const demoLink = within(overlay).getByRole('link', { name: /request demo/i })
      expect(demoLink).toHaveAttribute('href', '/#demo-scheduler')
    })
  })
})
