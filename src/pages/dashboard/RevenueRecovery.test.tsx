import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import RevenueRecovery from './RevenueRecovery'
import '@/i18n'

/**
 * Story 7.3 (AC 2 + AC 6): Coverage for the Revenue Recovery page.
 *
 * Asserts the structural contract of the Figma port:
 *   - The page mounts under `<DashboardLayout>` without crashing.
 *   - The "Revenue Recovery" page heading renders.
 *   - The three KPI metric cards render with the Figma labels.
 *   - The default `Action Required` tab is preselected and renders the
 *     three Action-Required rows from the mock data.
 *   - Switching to the `All Discrepancies` tab updates the rendered row
 *     count to all seven mock rows.
 *   - Switching to a tab with zero matches renders the empty-state row
 *     ("No discrepancies found for this view.").
 *
 * Full a11y axe scan deferred to Story 7.8 per AC 6.
 */

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    ;(globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver
  }
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dashboard/recovery']}>
      <Routes>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route path="recovery" element={<RevenueRecovery />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RevenueRecovery', () => {
  it('renders the Revenue Recovery page heading + subhead under DashboardLayout', () => {
    renderPage()
    const heading = screen.getByRole('heading', { level: 1, name: /Revenue Recovery/ })
    expect(heading).toBeInTheDocument()
    expect(screen.getByText(/Audit carrier statements and manage commission disputes/)).toBeInTheDocument()
  })

  it('renders the three KPI metric cards', () => {
    renderPage()
    expect(screen.getByText('Unrecovered Revenue')).toBeInTheDocument()
    expect(screen.getByText('In Dispute')).toBeInTheDocument()
    expect(screen.getByText('Recovered (YTD)')).toBeInTheDocument()
  })

  it('preselects the Action Required tab and renders its three rows', () => {
    renderPage()
    const tbody = screen.getByTestId('dashboard-recovery-tbody')
    const rows = within(tbody).getAllByTestId('dashboard-recovery-row')
    expect(rows).toHaveLength(3)
  })

  it('switching to All Discrepancies updates the rendered row count to seven', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByTestId('dashboard-recovery-tab-all-discrepancies'))
    const tbody = screen.getByTestId('dashboard-recovery-tbody')
    const rows = within(tbody).getAllByTestId('dashboard-recovery-row')
    expect(rows).toHaveLength(7)
  })

  it('renders the empty-state row when search filtering has zero matches', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/Search policies/), 'NO_MATCH_POLICY')
    await user.click(screen.getByRole('button', { name: /Filter results/ }))
    expect(screen.getByText('No discrepancies found for this view.')).toBeInTheDocument()
    expect(screen.getByText(/Showing 0 of 7 results/)).toBeInTheDocument()
  })

  it('keeps pagination boundary buttons disabled while all filtered rows are shown', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })
})
