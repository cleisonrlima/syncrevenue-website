import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Services from './Services'

const tMock = vi.fn((key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key)

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: tMock }),
}))

describe('Services', () => {
  const renderServices = () => render(<Services />)

  it('renders a region with the correct id', () => {
    renderServices()

    const section = screen.getByRole('region')
    expect(section).toHaveAttribute('id', 'services')
  })

  it('renders SectionHeader copy from i18n keys', () => {
    renderServices()

    expect(screen.getByText('Our Services')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Complete Revenue Intelligence Suite' })).toBeInTheDocument()
    expect(screen.getByText(/Whether you need automated reconciliation/)).toBeInTheDocument()
  })

  it('renders all four service cards with title and description', () => {
    renderServices()

    const services = [
      ['SyncRevenue', /Automated GDS commission reconciliation/],
      ['BI & Data Analytics', /booking and commission data/],
      ['Online Booking Tools', /support for OBT platforms/],
      ['Custom Development', /Bespoke solutions/],
    ] as const

    services.forEach(([title, description]) => {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
      expect(screen.getByText(description)).toBeInTheDocument()
    })
  })

  it('renders the contact hint', () => {
    renderServices()

    expect(screen.getByText('Not sure which service fits? Contact us.')).toBeInTheDocument()
  })

  it('uses translation keys for all visible section copy', () => {
    renderServices()

    const usedKeys = tMock.mock.calls.map(([key]) => key)
    expect(usedKeys).toEqual(
      expect.arrayContaining([
        'services.eyebrow',
        'services.headline',
        'services.subtext',
        'services.syncrevenue.title',
        'services.syncrevenue.description',
        'services.analytics.title',
        'services.analytics.description',
        'services.obts.title',
        'services.obts.description',
        'services.custom.title',
        'services.custom.description',
        'services.contact',
      ]),
    )
  })
})
