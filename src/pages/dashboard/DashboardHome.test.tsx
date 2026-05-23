import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHome from './DashboardHome'
import '@/i18n'

/**
 * Story 7.3 (AC 1 + AC 6): Coverage for the dashboard Overview page.
 *
 * Asserts the structural contract of the Figma port:
 *   - The page mounts under `<DashboardLayout>` without crashing.
 *   - The "Overview" page heading + descriptive copy render.
 *   - The three KPI metric cards (Total Recovered / Active
 *     Discrepancies / Payouts Processed) render with the Figma values.
 *   - The Revenue Recovery Trend section + the time-range `<select>`
 *     render.
 *   - The Recent Discrepancies side list renders all four mock rows.
 *
 * recharts internals are not asserted on — its SVG output relies on
 * `ResizeObserver` + non-zero container dimensions that jsdom does not
 * provide reliably. We assert on the outer `data-testid` wrapper instead
 * (the wrapper is what AC 1 explicitly contracts on). Full a11y axe scan
 * is deferred to Story 7.8 per AC 6.
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

function renderPage(initialRoute = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('DashboardHome (Overview)', () => {
  it('renders the Overview page heading + subhead under DashboardLayout', () => {
    renderPage()
    const heading = screen.getByRole('heading', { level: 1, name: /Overview/ })
    expect(heading).toBeInTheDocument()
    expect(screen.getByText(/Here's what's happening with your revenue today/)).toBeInTheDocument()
  })

  it('renders the three KPI metric cards with Figma values', () => {
    renderPage()
    expect(screen.getByText('Total Recovered')).toBeInTheDocument()
    expect(screen.getByText('$51,900.00')).toBeInTheDocument()
    expect(screen.getByText('Active Discrepancies')).toBeInTheDocument()
    expect(screen.getByText('Payouts Processed')).toBeInTheDocument()
    expect(screen.getByText('$142,300.00')).toBeInTheDocument()
  })

  it('renders the Revenue Recovery Trend section with the time-range select', async () => {
    const user = userEvent.setup()
    renderPage()
    expect(screen.getByRole('heading', { level: 2, name: /Revenue Recovery Trend/ })).toBeInTheDocument()
    const select = screen.getByTestId('dashboard-home-time-range') as HTMLSelectElement
    expect(select).toBeInTheDocument()
    // Story 7.5 — time-range option `value` is now a stable ID
    // (`last7Months` / `thisYear` / `allTime`); the displayed text is the
    // translated label. The assertions follow that split.
    expect(within(select).getByText('Last 7 Months')).toBeInTheDocument()
    expect(within(select).getByText('This Year')).toBeInTheDocument()
    expect(within(select).getByText('All Time')).toBeInTheDocument()
    await user.selectOptions(select, 'allTime')
    expect(select.value).toBe('allTime')
  })

  it('renders the area chart container target (recharts internals not asserted)', () => {
    renderPage()
    expect(screen.getByTestId('dashboard-home-area-chart')).toBeInTheDocument()
  })

  it('renders all four Recent Discrepancies rows from the mock data', () => {
    renderPage()
    const list = screen.getByTestId('dashboard-home-recent-list')
    expect(within(list).getByText('POL-8823')).toBeInTheDocument()
    expect(within(list).getByText('POL-9011')).toBeInTheDocument()
    expect(within(list).getByText('POL-7734')).toBeInTheDocument()
    expect(within(list).getByText('POL-8824')).toBeInTheDocument()
    expect(within(list).getByText('Delta $400.00')).toBeInTheDocument()
    // "Global Life" appears twice (rows 1 + 4); use getAllByText.
    expect(within(list).getAllByText('Global Life')).toHaveLength(2)
  })
})
