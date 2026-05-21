import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Comparison from './Comparison'

const tMock = vi.fn((key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key)

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: tMock }),
}))

describe('Comparison', () => {
  const renderComparison = () => render(<Comparison />)

  it('renders a named comparison region with the correct id', () => {
    renderComparison()

    const section = screen.getByRole('region', {
      name: 'SyncRevenue comparison against manual and generic tools',
    })
    expect(section).toHaveAttribute('id', 'comparison')
  })

  it('renders SectionHeader copy from i18n keys', () => {
    renderComparison()

    expect(screen.getByText('Why SyncRevenue')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Stop Losing Revenue to Manual Processes' })).toBeInTheDocument()
    expect(screen.getByText(/automated commission management compares/)).toBeInTheDocument()
  })

  it('renders all required row labels and generic comparison column headers', () => {
    renderComparison()

    ;['Feature', 'SyncRevenue', 'Manual / Legacy Tools', 'Generic Tools'].forEach(header => {
      expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument()
    })

    ;[
      'BSP/ARC Reconciliation',
      'Debit Memo Dispute Management',
      'Multi-GDS Integration',
      'Real-Time Commission Reporting',
      'Automated Audit Trail',
    ].forEach(rowLabel => {
      expect(screen.getByRole('rowheader', { name: rowLabel })).toBeInTheDocument()
    })
  })

  it('does not render competitor brand names in comparison copy', () => {
    const { container } = renderComparison()
    const renderedCopy = container.textContent ?? ''

    ;['Amadeus Agency360', 'Sabre Red 360', 'TravelWorks', 'MIDOCO', 'QuickBooks', 'Excel'].forEach(
      bannedName => {
        expect(renderedCopy).not.toContain(bannedName)
      },
    )
  })

  it('uses a mobile horizontal scroll wrapper with a stable table width', () => {
    renderComparison()

    const table = screen.getByRole('table', {
      name: 'SyncRevenue comparison against manual and generic tools',
    })
    const wrapper = table.parentElement

    expect(wrapper).toHaveClass('overflow-x-auto')
    expect(table).toHaveClass('min-w-[720px]')
  })

  it('uses translation keys for visible table copy', () => {
    renderComparison()

    const usedKeys = tMock.mock.calls.map(([key]) => key)
    expect(usedKeys).toEqual(
      expect.arrayContaining([
        'comparison.ariaLabel',
        'comparison.eyebrow',
        'comparison.headline',
        'comparison.subtext',
        'comparison.featureHeader',
        'comparison.syncrevenueHeader',
        'comparison.legacyHeader',
        'comparison.genericHeader',
        'comparison.features.reconciliation.label',
        'comparison.features.reconciliation.syncrevenue',
        'comparison.features.reconciliation.legacy',
        'comparison.features.reconciliation.generic',
        'comparison.features.debitMemo.label',
        'comparison.features.gdsIntegration.label',
        'comparison.features.reporting.label',
        'comparison.features.audit.label',
      ]),
    )
  })

  it('keeps readable text classes on the sober ink section background', () => {
    // Refactored to sober palette: section renders dark `--ink`, row headers
    // pop in pure white, body cells use `white/[0.78]` for the SyncRevenue
    // column and dimmer `white/55` for the legacy/generic columns.
    renderComparison()

    const section = screen.getByRole('region', {
      name: 'SyncRevenue comparison against manual and generic tools',
    })
    const rowHeader = within(section).getByRole('rowheader', { name: 'BSP/ARC Reconciliation' })
    const cell = within(section).getByText(/Automatically detects settlement discrepancies/)

    expect(section).toHaveClass('bg-[var(--ink)]')
    expect(rowHeader).toHaveClass('text-white')
    expect(cell).toHaveClass('text-white/[0.78]')
  })
})
