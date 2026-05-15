import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Home from './Home'
import '@/i18n'

describe('Home', () => {
  it('renders SyncRevenue, Services, Comparison, and Security in the scroll sequence', async () => {
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

    expect(syncRevenue).toHaveAttribute('id', 'syncrevenue')
    expect(services).toHaveAttribute('id', 'services')
    expect(comparison).toHaveAttribute('id', 'comparison')
    expect(security).toHaveAttribute('id', 'security')
    expect(syncRevenue.compareDocumentPosition(services)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(services.compareDocumentPosition(comparison)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(comparison.compareDocumentPosition(security)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })
})
