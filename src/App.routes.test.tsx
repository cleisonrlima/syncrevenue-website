import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import '@/i18n'

/**
 * Story 7.2 (AC 3, 4, 6): Public Navbar + Footer gating assertions.
 *
 * The public Navbar (selectable via `data-testid="navbar-root"` from
 * Story 1.4) must render for `/`, `/privacy`, and `/admin/*` — but must
 * NOT render for the Epic 7 surfaces that own their own chrome
 * (`/dashboard/*`, `/v2`, `/demo`).
 *
 * AdminLayout is rendered through the Routes tree even when admin auth
 * is not bootstrapped — it shows a loading skeleton — so the assertions
 * here only need to inspect the presence/absence of the public Navbar,
 * not the admin nav itself.
 */

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App route chrome gating', () => {
  it('renders the public Navbar on /', () => {
    renderAt('/')
    expect(screen.getByTestId('navbar-root')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('renders the public Navbar on /privacy', () => {
    renderAt('/privacy')
    expect(screen.getByTestId('navbar-root')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('renders the public Navbar on /admin/login (admin coexists with public chrome)', () => {
    renderAt('/admin/login')
    expect(screen.getByTestId('navbar-root')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('does NOT render the public Navbar on /dashboard', () => {
    renderAt('/dashboard')
    expect(screen.queryByTestId('navbar-root')).not.toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    // DashboardLayout chrome should be present instead
    expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument()
  })

  it('does NOT render the public Navbar on a nested dashboard route', () => {
    renderAt('/dashboard/recovery')
    expect(screen.queryByTestId('navbar-root')).not.toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument()
  })

  it('does NOT render the public Navbar on /v2 (Landing has its own nav)', () => {
    renderAt('/v2')
    expect(screen.queryByTestId('navbar-root')).not.toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    expect(screen.getByTestId('landing-placeholder-heading')).toBeInTheDocument()
  })

  it('does NOT render the public Navbar on /demo (DemoForm has its own nav)', () => {
    renderAt('/demo')
    expect(screen.queryByTestId('navbar-root')).not.toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    expect(screen.getByTestId('demo-placeholder-heading')).toBeInTheDocument()
  })

  it('keeps Epic 7 chrome suppression with trailing slashes', () => {
    const landing = renderAt('/v2/')
    expect(screen.queryByTestId('navbar-root')).not.toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    landing.unmount()

    renderAt('/demo/')
    expect(screen.queryByTestId('navbar-root')).not.toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  })

  it('does NOT render public chrome on unknown catch-all routes', () => {
    renderAt('/missing-route')
    expect(screen.queryByTestId('navbar-root')).not.toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
  })

  it('renders unknown dashboard child routes inside DashboardLayout', () => {
    renderAt('/dashboard/missing-route')
    expect(screen.queryByTestId('navbar-root')).not.toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
  })

  it('renders the dashboard index page (DashboardHome placeholder) at /dashboard', () => {
    renderAt('/dashboard')
    expect(screen.getByTestId('dashboard-home-placeholder')).toBeInTheDocument()
  })

  it('renders each dashboard child route under DashboardLayout', () => {
    const cases = [
      { path: '/dashboard/recovery', testid: 'dashboard-recovery-placeholder' },
      { path: '/dashboard/payouts', testid: 'dashboard-payouts-placeholder' },
      { path: '/dashboard/insights', testid: 'dashboard-insights-placeholder' },
      { path: '/dashboard/settings', testid: 'dashboard-settings-placeholder' },
    ] as const

    for (const { path, testid } of cases) {
      const { unmount } = renderAt(path)
      expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument()
      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
      expect(screen.getByTestId(testid)).toBeInTheDocument()
      unmount()
    }
  })
})
