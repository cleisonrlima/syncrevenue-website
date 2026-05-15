import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'
import App from '@/App'
import '@/i18n'
import i18next from '@/i18n'
import { useLocaleStore } from '@/store/useLocaleStore'

const lazySectionWait = { timeout: 5000 }

describe('Story 1.9 trust sequence', () => {
  afterEach(async () => {
    cleanup()
    useLocaleStore.setState({ locale: 'en' })
    await i18next.changeLanguage('en')
  })

  it('renders Comparison, Security, ClientReferences, Team, and DemoScheduler in the required order', async () => {
    const { container } = render(<Home />)

    const comparison = await screen.findByRole('region', {
      name: 'SyncRevenue comparison against manual and generic tools',
    }, lazySectionWait)
    const security = await screen.findByRole('region', {
      name: 'Your Data is Protected',
    }, lazySectionWait)
    const clientReferences = await screen.findByRole('region', {
      name: 'Verified US travel agency references',
    }, lazySectionWait)
    const team = await screen.findByRole('region', {
      name: 'Sync Sirius team specialists',
    }, lazySectionWait)
    const demoScheduler = await waitFor(() => {
      const section = container.querySelector('#demo-scheduler')
      expect(section).toBeInTheDocument()
      return section as HTMLElement
    }, lazySectionWait)

    expect(comparison.compareDocumentPosition(security)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(security.compareDocumentPosition(clientReferences)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(clientReferences.compareDocumentPosition(team)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(team.compareDocumentPosition(demoScheduler)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('renders the production Security commitments as readable homepage copy', async () => {
    render(<Home />)

    const security = await screen.findByRole('region', {
      name: 'Your Data is Protected',
    }, lazySectionWait)

    expect(within(security).getByRole('heading', { name: 'Encrypted Transmission' })).toBeInTheDocument()
    expect(within(security).getByText(/encrypted in transit/i)).toBeInTheDocument()
    expect(within(security).getByRole('heading', { name: 'Certification Roadmap' })).toBeInTheDocument()
    expect(within(security).getByText(/SOC 2 Type II/i)).toBeInTheDocument()
    expect(within(security).getByRole('heading', { name: 'Contract Insurance' })).toBeInTheDocument()
    expect(within(security).getByText(/liability coverage requirements/i)).toBeInTheDocument()
    expect(
      within(security).getByRole('heading', { name: 'Website and Product Data Stay Separate' }),
    ).toBeInTheDocument()
    expect(within(security).getByText(/contact and demo inquiry fields only/i)).toBeInTheDocument()
    expect(within(security).getByText(/GDS credentials never touch the website/i)).toBeInTheDocument()
    expect(security.querySelectorAll('img')).toHaveLength(0)
  })

  it('renders ClientReferences section copy without vague reference placeholders', async () => {
    render(<Home />)

    const clientReferences = await screen.findByRole('region', {
      name: 'Verified US travel agency references',
    }, lazySectionWait)
    const renderedCopy = clientReferences.textContent ?? ''

    expect(
      within(clientReferences).getByRole('heading', { name: 'Trusted by US Travel Agencies' }),
    ).toBeInTheDocument()
    expect(within(clientReferences).getByText(/Named references are shared with approval/)).toBeInTheDocument()
    expect(renderedCopy).not.toMatch(/a leading TMC/i)
    expect(renderedCopy).not.toMatch(/recognized agency/i)
  })

  it('updates Security and ClientReferences through the real LanguageSwitcher', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Your Data is Protected' }, lazySectionWait)).toBeInTheDocument()

    const languageSwitcher = screen.getAllByRole('group', { name: 'Select language' })[0]
    await user.click(within(languageSwitcher).getByRole('button', { name: 'ES' }))

    expect(await screen.findByRole('heading', { name: 'Sus Datos Están Protegidos' }, lazySectionWait)).toBeInTheDocument()
    expect(screen.getByText(/Las credenciales GDS nunca tocan el sitio web/)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Confiado por Agencias de Viajes en EE.UU.' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Las referencias nombradas se comparten con aprobación/)).toBeInTheDocument()
  })
})
