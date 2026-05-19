import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'
import i18next from '@/i18n'
import { useLocaleStore } from '@/store/useLocaleStore'

describe('Story 1.6 visitor flow', () => {
  beforeEach(async () => {
    window.history.pushState({}, '', '/')
    localStorage.clear()
    useLocaleStore.setState({ locale: 'en' })
    await i18next.changeLanguage('en')
  })

  afterEach(async () => {
    cleanup()
    vi.restoreAllMocks()
    await i18next.changeLanguage('en')
    useLocaleStore.setState({ locale: 'en' })
  })

  const renderHome = () =>
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

  it('presents SyncRevenue then Services with the expected product and portfolio content', async () => {
    renderHome()

    const syncRevenue = await screen.findByRole('region', {
      name: 'Automated Commission Reconciliation',
    }, { timeout: 5000 })
    const services = await screen.findByRole('region', {
      name: 'Complete Revenue Intelligence Suite',
    }, { timeout: 5000 })

    expect(syncRevenue.compareDocumentPosition(services)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(within(syncRevenue).getByText(/SyncRevenue connects to your GDS feeds/)).toBeInTheDocument()
    expect(within(syncRevenue).getByText('GDS Integrations')).toBeInTheDocument()
    ;['Amadeus', 'Sabre', 'Galileo', 'Worldspan'].forEach(integration => {
      expect(within(syncRevenue).getByText(integration)).toBeInTheDocument()
    })
    expect(within(syncRevenue).getByText(/99.99% commission assertivity/)).toBeInTheDocument()

    ;[
      'SyncRevenue',
      'BI & Data Analytics',
      'Online Booking Tools',
      'Custom Development',
    ].forEach(service => {
      expect(within(services).getByRole('heading', { name: service })).toBeInTheDocument()
    })
    expect(within(services).getByText('Not sure which service fits? Contact us.')).toBeInTheDocument()
  })

  it('updates story 1.6 section copy through the real language switcher without navigating', async () => {
    const user = userEvent.setup()
    renderHome()

    expect(
      await screen.findByRole('heading', { name: 'Automated Commission Reconciliation' }),
    ).toBeInTheDocument()

    const pathBeforeLocaleChange = window.location.pathname
    await user.click(screen.getAllByRole('button', { name: 'EN' })[0])
    await user.click(screen.getByRole('menuitemradio', { name: 'PT-BR' }))

    expect(window.location.pathname).toBe(pathBeforeLocaleChange)
    expect(localStorage.getItem('i18nextLng')).toBe('pt-BR')
    expect(
      await screen.findByRole('heading', { name: 'Reconciliação Automatizada de Comissões' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/99,99% de assertividade de comissões/)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Suite Completa de Inteligência de Receita' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Não sabe qual serviço é ideal? Entre em contato.')).toBeInTheDocument()
  })
})
