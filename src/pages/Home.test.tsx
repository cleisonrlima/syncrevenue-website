import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from './Home'
import '@/i18n'

describe('Home', () => {
  it('renders SyncRevenue followed by Services in the scroll sequence', async () => {
    render(<Home />)

    const syncRevenue = await screen.findByRole('region', {
      name: 'Automated Commission Reconciliation',
    })
    const services = await screen.findByRole('region', {
      name: 'Complete Revenue Intelligence Suite',
    })

    expect(syncRevenue).toHaveAttribute('id', 'syncrevenue')
    expect(services).toHaveAttribute('id', 'services')
    expect(syncRevenue.compareDocumentPosition(services)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })
})
