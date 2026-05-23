import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Insights from './Insights'
import '@/i18n'

/**
 * Story 7.3 (AC 4 + AC 6): Coverage for the Predictive Insights page.
 *
 * Asserts the structural contract of the Figma port:
 *   - The page mounts under `<DashboardLayout>` without crashing.
 *   - The "Predictive Insights" page heading renders.
 *   - All four KPI metric cards render with the Figma labels.
 *   - The three chart sections (Annual Revenue Forecast, Regional
 *     Distribution, Product Lines) and the Top Agencies list are present.
 *   - All four Top Agencies rows render from the mock data.
 *
 * recharts SVG internals are not asserted on. Full a11y axe scan deferred
 * to Story 7.8 per AC 6.
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
    <MemoryRouter initialEntries={['/dashboard/insights']}>
      <Routes>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route path="insights" element={<Insights />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('Insights', () => {
  it('renders the Predictive Insights page heading + subhead under DashboardLayout', () => {
    renderPage()
    const heading = screen.getByRole('heading', { level: 1, name: /Predictive Insights/ })
    expect(heading).toBeInTheDocument()
    expect(
      screen.getByText(/Forecast cash flow and visualize global agency performance/),
    ).toBeInTheDocument()
  })

  it('renders all four KPI metric cards', () => {
    renderPage()
    expect(screen.getByText('Global Revenue YTD')).toBeInTheDocument()
    expect(screen.getByText('Forecasted EOY')).toBeInTheDocument()
    expect(screen.getByText('Average Margin')).toBeInTheDocument()
    expect(screen.getByText('Active Territories')).toBeInTheDocument()
  })

  it('renders the three chart sections + the Top Agencies side list', () => {
    renderPage()
    expect(screen.getByTestId('dashboard-insights-forecast')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-insights-regional')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-insights-product')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-insights-top-agents')).toBeInTheDocument()
  })

  it('renders all four Top Agencies rows', () => {
    renderPage()
    const list = screen.getByTestId('dashboard-insights-top-agents')
    expect(within(list).getByText('Meridian Travel')).toBeInTheDocument()
    expect(within(list).getByText('Apex Voyages')).toBeInTheDocument()
    expect(within(list).getByText('SkyBridge Travel')).toBeInTheDocument()
    expect(within(list).getByText('Global Wings Ltd')).toBeInTheDocument()
  })
})
