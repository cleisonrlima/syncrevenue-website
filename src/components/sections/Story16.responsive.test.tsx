import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import SyncRevenue from './SyncRevenue'
import Services from './Services'
import '@/i18n'

// Story 1.6 set responsive + contrast contracts against the old light palette.
// The design-handoff alignment moved SyncRevenue + Services onto the sober
// dark sec/sec-deep system, so the assertions follow the new palette while
// preserving the underlying intents (mobile-first grid stacking + readable
// muted-white text on dark backgrounds).
describe('Story 1.6 responsive and contrast contracts', () => {
  it('keeps SyncRevenue on the sober sec-deep background with a 2-col mobile / 4-col desktop GDS grid', () => {
    render(<SyncRevenue />)

    const section = screen.getByRole('region', {
      name: 'Automated Commission Reconciliation',
    })
    const container = section.firstElementChild?.nextElementSibling
    const gdsGrid = within(section).getByText('Amadeus').closest('.grid')

    expect(section).toHaveClass('bg-[#0A0B22]')
    expect(container).toHaveClass(
      'max-w-[1320px]',
      'px-5',
      'sm:px-8',
      'lg:px-14',
    )
    expect(gdsGrid).toHaveClass('grid-cols-2', 'lg:grid-cols-4')
    expect(within(section).getByText(/99.99% commission assertivity/)).toHaveClass(
      'text-white/[0.65]',
    )

    const eyebrow = within(section).getByText('Our Flagship Product')
    const subtext = within(section).getByText(/SyncRevenue connects to your GDS feeds/)
    expect(eyebrow).toHaveClass('text-white/50')
    expect(subtext).toHaveClass('text-white/[0.65]')
  })

  it('keeps Services on the sober sec-deep background with mobile-first card stacking', () => {
    render(<Services />)

    const section = screen.getByRole('region', {
      name: 'Complete Revenue Intelligence Suite',
    })
    const container = section.firstElementChild
    const cardGrid = within(section).getByText('BI & Data Analytics').closest('.grid')

    expect(section).toHaveClass('bg-[#0A0B22]')
    expect(container).toHaveClass(
      'max-w-[1320px]',
      'px-5',
      'sm:px-8',
      'lg:px-14',
    )
    expect(cardGrid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4')
    expect(within(section).getByText('Not sure which service fits? Contact us.')).toHaveClass(
      'text-white/55',
    )

    const eyebrow = within(section).getByText('Our Services')
    const subtext = within(section).getByText(/Whether you need automated reconciliation/)
    expect(eyebrow).toHaveClass('text-white/50')
    expect(subtext).toHaveClass('text-white/[0.65]')
  })
})
