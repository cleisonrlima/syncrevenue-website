import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Home from './Home'
import '@/i18n'

describe('Home', () => {
  it('renders the public trust sequence with Team before the demo ask', async () => {
    const { container } = render(<Home />)

    const syncRevenue = await screen.findByRole('region', {
      name: 'Automated Commission Reconciliation',
    }, { timeout: 3000 })
    const services = await screen.findByRole('region', {
      name: 'Complete Revenue Intelligence Suite',
    }, { timeout: 3000 })
    const comparison = await screen.findByRole('region', {
      name: 'SyncRevenue comparison against manual and generic tools',
    }, { timeout: 3000 })
    await waitFor(() => {
      expect(container.querySelector('#security')).toBeInTheDocument()
    }, { timeout: 3000 })
    const security = container.querySelector('#security') as HTMLElement
    await waitFor(() => {
      expect(container.querySelector('#clientes')).toBeInTheDocument()
    }, { timeout: 3000 })
    const clientReferences = container.querySelector('#clientes') as HTMLElement
    const team = await screen.findByRole('region', {
      name: 'Sync Sirius team specialists',
    }, { timeout: 3000 })
    await waitFor(() => {
      expect(container.querySelector('#agendar-demo')).toBeInTheDocument()
    }, { timeout: 3000 })
    const demoScheduler = container.querySelector('#agendar-demo') as HTMLElement

    expect(syncRevenue).toHaveAttribute('id', 'syncrevenue')
    expect(services).toHaveAttribute('id', 'services')
    expect(comparison).toHaveAttribute('id', 'comparison')
    expect(security).toHaveAttribute('id', 'security')
    expect(clientReferences).toHaveAttribute('id', 'clientes')
    expect(team).toHaveAttribute('id', 'equipe')
    expect(demoScheduler).toHaveAttribute('id', 'agendar-demo')
    expect(syncRevenue.compareDocumentPosition(services)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(services.compareDocumentPosition(comparison)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(comparison.compareDocumentPosition(security)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(security.compareDocumentPosition(clientReferences)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(clientReferences.compareDocumentPosition(team)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(team.compareDocumentPosition(demoScheduler)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })
})
