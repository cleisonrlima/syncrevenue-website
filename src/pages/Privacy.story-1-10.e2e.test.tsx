import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import App from '@/App'
import i18next from '@/i18n'
import { useLocaleStore } from '@/store/useLocaleStore'

const originalScrollYDescriptor = Object.getOwnPropertyDescriptor(window, 'scrollY')

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

describe('Story 1.10 privacy policy visitor flow', () => {
  beforeEach(async () => {
    localStorage.clear()
    window.history.pushState({}, '', '/')
    useLocaleStore.setState({ locale: 'en' })
    await i18next.changeLanguage('en')
  })

  afterEach(async () => {
    cleanup()
    vi.restoreAllMocks()
    if (originalScrollYDescriptor) {
      Object.defineProperty(window, 'scrollY', originalScrollYDescriptor)
    }
    useLocaleStore.setState({ locale: 'en' })
    await i18next.changeLanguage('en')
    window.history.pushState({}, '', '/')
  })

  it('opens /privacy as a routable policy page with the required compliance commitments', async () => {
    renderAppAt('/privacy')

    expect(await screen.findByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/privacy')

    const policy = screen.getByRole('article', { name: 'Privacy Policy' })
    const policyCopy = policy.textContent ?? ''

    expect(within(policy).getByRole('heading', { level: 2, name: 'Information We Collect' })).toBeInTheDocument()
    ;['name', 'email', 'company', 'phone', 'role', 'GDS system', 'message'].forEach((field) => {
      expect(policyCopy).toMatch(new RegExp(field, 'i'))
    })
    expect(policyCopy).toMatch(/secured SQLite/i)
    expect(policyCopy).toMatch(/admin-only/i)
    expect(policyCopy).toMatch(/24 months from the submission date/i)
    expect(policyCopy).toMatch(/no analytics or tracking cookies/i)
    expect(policyCopy).toMatch(/only functional cookies/i)
    expect(policyCopy).toMatch(/GDS credentials are never collected by this website/i)
    expect(policyCopy).toMatch(/LGPD/i)
    expect(policyCopy).toMatch(/CCPA/i)
    expect(within(policy).getByRole('link', { name: 'privacy@syncsirius.com' })).toHaveAttribute(
      'href',
      'mailto:privacy@syncsirius.com',
    )
  })

  it('switches privacy policy locales in place without navigation or scroll reset', async () => {
    const user = userEvent.setup()
    const scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 720 })

    renderAppAt('/privacy')

    expect(await screen.findByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument()
    const pathBeforeLanguageChange = window.location.pathname

    const languageSwitcher = screen.getAllByRole('group', { name: 'Select language' })[0]
    await user.click(within(languageSwitcher).getByRole('button', { name: 'EN' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'PT-BR' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Política de Privacidade' })).toBeInTheDocument()
    expect(screen.getByText(/24 meses a partir da data de envio/i)).toBeInTheDocument()
    expect(window.location.pathname).toBe(pathBeforeLanguageChange)
    expect(window.location.pathname).not.toBe('/pt-BR/privacy')
    expect(window.scrollY).toBe(720)
    expect(scrollSpy).not.toHaveBeenCalled()

    await user.click(within(languageSwitcher).getByRole('button', { name: 'PT-BR' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'ES' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Política de Privacidad' })).toBeInTheDocument()
    expect(screen.getByText(/24 meses desde la fecha de envío/i)).toBeInTheDocument()
    expect(window.location.pathname).toBe('/privacy')
  })

  it('navigates from the footer privacy link and returns home with browser back', async () => {
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
