import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import App from '@/App'
import Privacy from './Privacy'
import i18next from '@/i18n'
import { useLocaleStore } from '@/store/useLocaleStore'

function renderAppAt(path: string) {
  window.history.pushState({}, '', path)

  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  )
}

function findHomeHeroHeading() {
  // The app-level home route renders the section-based Landing.tsx.
  return screen.findByRole('heading', { name: /More commission per ticket/i }, { timeout: 5000 })
}

describe('Privacy page', () => {
  beforeEach(async () => {
    localStorage.clear()
    useLocaleStore.setState({ locale: 'en' })
    await i18next.changeLanguage('en')
  })

  afterEach(async () => {
    cleanup()
    vi.restoreAllMocks()
    useLocaleStore.setState({ locale: 'en' })
    await i18next.changeLanguage('en')
    window.history.pushState({}, '', '/')
  })

  it('renders required English privacy commitments', () => {
    render(<Privacy />)

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument()
    expect(screen.getByText(/Last updated: May 2026/i)).toBeInTheDocument()

    const article = screen.getByRole('article', { name: 'Privacy Policy' })
    const policyCopy = article.textContent ?? ''

    ;['name', 'email', 'company', 'phone', 'role', 'GDS system', 'message'].forEach(field => {
      expect(policyCopy).toMatch(new RegExp(field, 'i'))
    })

    expect(policyCopy).toMatch(/secured SQLite/i)
    expect(policyCopy).toMatch(/admin-only/i)
    expect(policyCopy).toMatch(/24 months from the submission date/i)
    expect(policyCopy).toMatch(/privacy@syncsirius\.com/i)
    expect(policyCopy).toMatch(/LGPD/i)
    expect(policyCopy).toMatch(/CCPA/i)
    expect(policyCopy).toMatch(/no analytics or tracking cookies/i)
    expect(policyCopy).toMatch(/only functional cookies/i)
    expect(policyCopy).toMatch(/GDS credentials are never collected by this website/i)
    expect(screen.getByRole('link', { name: /privacy@syncsirius\.com/i })).toHaveAttribute(
      'href',
      'mailto:privacy@syncsirius.com',
    )
  })

  it('renders pt-BR content on the same /privacy path', async () => {
    await i18next.changeLanguage('pt-BR')
    useLocaleStore.setState({ locale: 'pt-BR' })
    renderAppAt('/privacy')

    expect(window.location.pathname).toBe('/privacy')
    expect(await screen.findByRole('heading', { level: 1, name: 'Política de Privacidade' })).toBeInTheDocument()
    expect(screen.getByText(/24 meses a partir da data de envio/i)).toBeInTheDocument()
    expect(screen.getAllByText(/LGPD/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/CCPA/i).length).toBeGreaterThan(0)
  })

  it('updates copy in place when language changes without path or scroll reset', async () => {
    const user = userEvent.setup()
    const scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 640 })

    renderAppAt('/privacy')
    expect(await screen.findByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/privacy')

    const languageSwitcher = screen.getAllByRole('group', { name: 'Select language' })[0]
    await user.click(within(languageSwitcher).getByRole('button', { name: 'EN' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'PT-BR' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Política de Privacidade' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/privacy')
    expect(window.scrollY).toBe(640)
    expect(scrollSpy).not.toHaveBeenCalled()
  })

  it('uses client-side footer navigation to /privacy and browser back returns home', async () => {
    const user = userEvent.setup()
    renderAppAt('/')

    expect(await findHomeHeroHeading()).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Privacy Policy' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/privacy')

    window.history.back()
    await waitFor(() => expect(window.location.pathname).toBe('/'))
    expect(await findHomeHeroHeading()).toBeInTheDocument()
  })
})
