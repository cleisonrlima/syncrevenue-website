import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'
import '@/i18n'

/**
 * Story 7.2 (AC 6): DashboardLayout sidebar nav + active-state coverage.
 *
 * The scaffold's coverage promise is narrow on purpose — page bodies land
 * in Story 7.3, so these tests only assert structural contracts:
 *   1. Five sidebar nav items render with the AC2 labels.
 *   2. Each nav item is a real link that updates `useLocation()`.
 *   3. The active link receives the `bg-white/10 text-white` classes per
 *      AC2 + AC6 (other links receive the inactive `text-white/70` class).
 */

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location-probe">{location.pathname}</div>
}

function renderLayout(initialRoute = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<LocationProbe />} />
          <Route path="recovery" element={<LocationProbe />} />
          <Route path="payouts" element={<LocationProbe />} />
          <Route path="insights" element={<LocationProbe />} />
          <Route path="settings" element={<LocationProbe />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

const NAV_LABELS = ['Overview', 'Revenue Recovery', 'Payouts', 'Insights', 'Settings'] as const

describe('DashboardLayout', () => {
  it('renders five sidebar nav items with the AC2 labels', () => {
    renderLayout()
    const sidebar = screen.getByTestId('dashboard-sidebar-nav')
    const links = within(sidebar).getAllByRole('link')
    expect(links).toHaveLength(5)
    NAV_LABELS.forEach((label, idx) => {
      expect(links[idx]).toHaveTextContent(label)
    })
  })

  it('renders the dashboard chrome (sidebar + header + main outlet target)', () => {
    renderLayout()
    expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-main')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-search-input')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-bell-button')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-import-cta')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-user-card')).toBeInTheDocument()
  })

  it('marks Overview active when location is /dashboard', () => {
    renderLayout('/dashboard')
    const overview = screen.getByTestId('dashboard-nav-dashboard')
    expect(overview.className).toContain('bg-white/10')
    expect(overview.className).toContain('text-white')

    // A non-active sibling should NOT have the active class
    const payouts = screen.getByTestId('dashboard-nav-payouts')
    expect(payouts.className).not.toContain('bg-white/10')
    expect(payouts.className).toContain('text-white/70')
  })

  it('marks Revenue Recovery active when location is /dashboard/recovery', () => {
    renderLayout('/dashboard/recovery')
    const recovery = screen.getByTestId('dashboard-nav-recovery')
    expect(recovery.className).toContain('bg-white/10')

    const overview = screen.getByTestId('dashboard-nav-dashboard')
    // Overview uses `end` strict-match so it must NOT be active on nested routes
    expect(overview.className).not.toContain('bg-white/10')
  })

  it('clicking a nav item updates useLocation().pathname', async () => {
    const user = userEvent.setup()
    renderLayout('/dashboard')
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/dashboard')

    await user.click(screen.getByTestId('dashboard-nav-insights'))
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/dashboard/insights')

    // Active class should swap to the new route
    const insights = screen.getByTestId('dashboard-nav-insights')
    expect(insights.className).toContain('bg-white/10')
  })
})
