import { describe, it, expect } from 'vitest'
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
})
