import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import SyncRevenue from './SyncRevenue'
import Services from './Services'
import '@/i18n'

describe('Story 1.6 responsive and contrast contracts', () => {
  it('keeps SyncRevenue on approved light backgrounds with a single-column mobile GDS grid', () => {
    render(<SyncRevenue />)

    const section = screen.getByRole('region', {
      name: 'Automated Commission Reconciliation',
    })
    const container = section.firstElementChild
    const gdsGrid = within(section).getByText('Amadeus').closest('.grid')

    expect(section).toHaveClass('bg-white')
    expect(container).toHaveClass('max-w-[1280px]', 'px-4', 'sm:px-6', 'lg:px-8')
    expect(gdsGrid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4')
    expect(within(section).getByText(/99.99% commission assertivity/)).toHaveClass('text-brand-slate')

    const eyebrow = within(section).getByText('Our Flagship Product')
    const subtext = within(section).getByText(/SyncRevenue connects to your GDS feeds/)
    expect(eyebrow).toHaveClass('text-brand-electric-blue')
    expect(subtext).toHaveClass('text-brand-slate')
    expect(subtext).not.toHaveClass('text-brand-deep')
  })

  it('keeps Services on an approved light background with mobile-first card stacking', () => {
    render(<Services />)

    const section = screen.getByRole('region', {
      name: 'Complete Revenue Intelligence Suite',
    })
    const container = section.firstElementChild
    const cardGrid = within(section).getByText('BI & Data Analytics').closest('.grid')

    expect(section).toHaveClass('bg-[#F4F6FA]')
    expect(container).toHaveClass('max-w-[1280px]', 'px-4', 'sm:px-6', 'lg:px-8')
    expect(cardGrid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4')
    expect(within(section).getByText('Not sure which service fits? Contact us.')).toHaveClass(
      'text-brand-slate',
    )

    const eyebrow = within(section).getByText('Our Services')
    const subtext = within(section).getByText(/Whether you need automated reconciliation/)
    expect(eyebrow).toHaveClass('text-brand-electric-blue')
    expect(subtext).toHaveClass('text-brand-slate')
    expect(subtext).not.toHaveClass('text-brand-deep')
  })
})
