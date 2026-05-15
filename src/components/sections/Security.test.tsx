import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Security from './Security'

const tMock = vi.fn((key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key)

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: tMock }),
}))

describe('Security', () => {
  beforeEach(() => {
    tMock.mockClear()
  })

  it('renders an accessible security region labelled by its h2', () => {
    render(<Security />)

    const heading = screen.getByRole('heading', { name: 'Your Data is Protected' })
    const section = screen.getByRole('region', { name: 'Your Data is Protected' })

    expect(section).toHaveAttribute('id', 'security')
    expect(section).toHaveAttribute('aria-labelledby', 'security-heading')
    expect(heading).toHaveAttribute('id', 'security-heading')
  })

  it('renders the four required readable security commitments', () => {
    render(<Security />)

    const section = screen.getByRole('region', { name: 'Your Data is Protected' })

    ;[
      'Encrypted Transmission',
      'Certification Roadmap',
      'Contract Insurance',
      'Website and Product Data Stay Separate',
    ].forEach(title => {
      expect(within(section).getByRole('heading', { name: title })).toBeInTheDocument()
    })

    expect(within(section).getByText(/encrypted in transit/i)).toBeInTheDocument()
    expect(within(section).getByText(/SOC 2 Type II/i)).toBeInTheDocument()
    expect(within(section).getByText(/liability coverage/i)).toBeInTheDocument()
    expect(within(section).getByText(/GDS credentials never touch the website/i)).toBeInTheDocument()
  })

  it('uses translation keys for all visible copy', () => {
    render(<Security />)

    const usedKeys = tMock.mock.calls.map(([key]) => key)
    expect(usedKeys).toEqual(
      expect.arrayContaining([
        'security.eyebrow',
        'security.headline',
        'security.subtext',
        'security.commitments.encryption.title',
        'security.commitments.encryption.description',
        'security.commitments.certification.title',
        'security.commitments.certification.description',
        'security.commitments.insurance.title',
        'security.commitments.insurance.description',
        'security.separation.title',
        'security.separation.description',
      ]),
    )
  })

  it('keeps security information in readable text instead of image-only content', () => {
    const { container } = render(<Security />)

    expect(container.querySelectorAll('img')).toHaveLength(0)
    expect(screen.getByText(/website collects contact and demo inquiry fields only/i)).toBeInTheDocument()
  })
})
