import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Home from './Home'
import '@/i18n'

describe('Home', () => {
  it('renders the public trust sequence with Team before the demo ask', async () => {
    const { container } = render(<Home />)

    const syncRevenue = await screen.findByRole('region', {
      name: 'Automated Commission Reconciliation',
    })
    const services = await screen.findByRole('region', {
      name: 'Complete Revenue Intelligence Suite',
    })
    const comparison = await screen.findByRole('region', {
      name: 'SyncRevenue comparison against manual and generic tools',
    })
    await waitFor(() => {
      expect(container.querySelector('#security')).toBeInTheDocument()
    })
    const security = container.querySelector('#security') as HTMLElement
    await waitFor(() => {
      expect(container.querySelector('#client-references')).toBeInTheDocument()
    })
    const clientReferences = container.querySelector('#client-references') as HTMLElement
    const team = await screen.findByRole('region', {
      name: 'Sync Sirius team specialists',
    })
    await waitFor(() => {
      expect(container.querySelector('#demo-scheduler')).toBeInTheDocument()
    })
    const demoScheduler = container.querySelector('#demo-scheduler') as HTMLElement

    expect(syncRevenue).toHaveAttribute('id', 'syncrevenue')
    expect(services).toHaveAttribute('id', 'services')
    expect(comparison).toHaveAttribute('id', 'comparison')
    expect(security).toHaveAttribute('id', 'security')
    expect(clientReferences).toHaveAttribute('id', 'client-references')
    expect(team).toHaveAttribute('id', 'team')
    expect(demoScheduler).toHaveAttribute('id', 'demo-scheduler')
    expect(syncRevenue.compareDocumentPosition(services)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(services.compareDocumentPosition(comparison)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(comparison.compareDocumentPosition(security)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(security.compareDocumentPosition(clientReferences)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(clientReferences.compareDocumentPosition(team)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(team.compareDocumentPosition(demoScheduler)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })
})
