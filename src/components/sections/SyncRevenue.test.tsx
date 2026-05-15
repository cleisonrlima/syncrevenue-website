import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SyncRevenue from './SyncRevenue'

const tMock = vi.fn((key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key)

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: tMock }),
}))

describe('SyncRevenue', () => {
  const renderSyncRevenue = () => render(<SyncRevenue />)

  it('renders a region with the correct id', () => {
    renderSyncRevenue()

    const section = screen.getByRole('region')
    expect(section).toHaveAttribute('id', 'syncrevenue')
  })

  it('renders SectionHeader copy from i18n keys', () => {
    renderSyncRevenue()

    expect(screen.getByText('Our Flagship Product')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Automated Commission Reconciliation' })).toBeInTheDocument()
    expect(screen.getByText(/SyncRevenue connects to your GDS feeds/)).toBeInTheDocument()
  })

  it('renders all GDS integrations from translation keys', () => {
    renderSyncRevenue()

    expect(screen.getByRole('heading', { name: 'GDS Integrations' })).toBeInTheDocument()
    ;['Amadeus', 'Sabre', 'Galileo', 'Worldspan'].forEach(integration => {
      expect(screen.getByText(integration)).toBeInTheDocument()
    })
  })

  it('renders the accuracy statement', () => {
    renderSyncRevenue()

    expect(screen.getByText(/99.99% commission assertivity/)).toBeInTheDocument()
  })

  it('uses translation keys for visible section copy', () => {
    renderSyncRevenue()

    const usedKeys = tMock.mock.calls.map(([key]) => key)
    expect(usedKeys).toEqual(
      expect.arrayContaining([
        'syncrevenue.eyebrow',
        'syncrevenue.headline',
        'syncrevenue.subtext',
        'syncrevenue.gds.title',
        'syncrevenue.gds.amadeus',
        'syncrevenue.gds.sabre',
        'syncrevenue.gds.galileo',
        'syncrevenue.gds.worldspan',
        'syncrevenue.accuracy',
      ]),
    )
  })
})
