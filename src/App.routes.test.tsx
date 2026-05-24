import { afterEach, describe, it, expect, beforeAll } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import i18next from '@/i18n'
import { useLocaleStore } from '@/store/useLocaleStore'

const lazyRouteWait = { timeout: 5000 }

// Story 7.3 (AC 6) update: the dashboard child routes now mount the full
// Figma ports which use recharts `ResponsiveContainer`. recharts depends on
// `ResizeObserver`, which is not provided by jsdom. The per-page Vitest
// specs install the same mock locally; this gating spec needs it too so
// the dashboard pages render inside the full `<App />` tree without the
// `<ErrorBoundary>` swallowing the crash.
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

afterEach(async () => {
  await act(async () => {
    await i18next.changeLanguage('en')
    useLocaleStore.setState({ locale: 'en' })
  })
})

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
    expect(screen.getByTestId('public-footer')).toBeInTheDocument()
  })

  it('renders the public Navbar on /privacy', () => {
    renderAt('/privacy')
    expect(screen.getByTestId('navbar-root')).toBeInTheDocument()
    expect(screen.getByTestId('public-footer')).toBeInTheDocument()
  })

  it('renders the public Navbar on /admin/login (admin coexists with public chrome)', () => {
    renderAt('/admin/login')
    expect(screen.getByTestId('navbar-root')).toBeInTheDocument()
    expect(screen.getByTestId('public-footer')).toBeInTheDocument()
  })

  it('does NOT render the public Navbar on /dashboard', async () => {
    renderAt('/dashboard')
    expect(screen.queryByTestId('navbar-root')).not.toBeInTheDocument()
    expect(screen.queryByTestId('public-footer')).not.toBeInTheDocument()
    // DashboardLayout chrome should be present instead
    expect(await screen.findByTestId('dashboard-sidebar', {}, lazyRouteWait)).toBeInTheDocument()
  })

  it('does NOT render the public Navbar on a nested dashboard route', async () => {
    renderAt('/dashboard/recovery')
    expect(screen.queryByTestId('navbar-root')).not.toBeInTheDocument()
    expect(screen.queryByTestId('public-footer')).not.toBeInTheDocument()
    expect(await screen.findByTestId('dashboard-sidebar', {}, lazyRouteWait)).toBeInTheDocument()
  })

  it('does NOT render the public Navbar on /v2 (Landing has its own nav)', () => {
    renderAt('/v2')
    expect(screen.queryByTestId('navbar-root')).not.toBeInTheDocument()
    expect(screen.queryByTestId('public-footer')).not.toBeInTheDocument()
  })

  it('does NOT render the public Navbar on /demo (DemoForm has its own nav)', async () => {
    renderAt('/demo')
    expect(screen.queryByTestId('navbar-root')).not.toBeInTheDocument()
    expect(screen.queryByTestId('public-footer')).not.toBeInTheDocument()
    expect(await screen.findByLabelText(/Work Email/i, {}, lazyRouteWait)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('resolves the lazy Landing body on /v2', async () => {
    renderAt('/v2')
    expect(await screen.findByText(/TRUSTED BY FORWARD-THINKING AGENCIES/, {}, lazyRouteWait)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('keeps Epic 7 chrome suppression with trailing slashes', () => {
    const landing = renderAt('/v2/')
    expect(screen.queryByTestId('navbar-root')).not.toBeInTheDocument()
    expect(screen.queryByTestId('public-footer')).not.toBeInTheDocument()
    landing.unmount()

    renderAt('/demo/')
    expect(screen.queryByTestId('navbar-root')).not.toBeInTheDocument()
    expect(screen.queryByTestId('public-footer')).not.toBeInTheDocument()
  })

  it('does NOT render public chrome on unknown catch-all routes', () => {
    renderAt('/missing-route')
    expect(screen.queryByTestId('navbar-root')).not.toBeInTheDocument()
    expect(screen.queryByTestId('public-footer')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
  })

  it('renders unknown dashboard child routes inside DashboardLayout', async () => {
    renderAt('/dashboard/missing-route')
    expect(screen.queryByTestId('navbar-root')).not.toBeInTheDocument()
    expect(screen.queryByTestId('public-footer')).not.toBeInTheDocument()
    expect(await screen.findByTestId('dashboard-sidebar', {}, lazyRouteWait)).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /page not found/i }, lazyRouteWait)).toBeInTheDocument()
  })

  it('renders the dashboard index page (DashboardHome) at /dashboard', async () => {
    renderAt('/dashboard')
    // Story 7.3 replaced the Story 7.2 `dashboard-home-placeholder` testid
    // with the full Figma port, which exposes `data-testid="dashboard-home"`
    // on its outer wrapper. Story 7.4 then made the dashboard routes
    // React.lazy split-points to unblock the SSG prerender pipeline — so
    // the child route commits asynchronously and we need `findBy*` to wait
    // on the Suspense boundary to resolve.
    expect(await screen.findByTestId('dashboard-home', {}, lazyRouteWait)).toBeInTheDocument()
  })

  it('renders each dashboard child route under DashboardLayout', async () => {
    // Story 7.3 testids match the page name with no `-placeholder` suffix.
    // Story 7.4 made each child route a React.lazy split-point — async wait.
    const cases = [
      { path: '/dashboard/recovery', testid: 'dashboard-recovery' },
      { path: '/dashboard/payouts', testid: 'dashboard-payouts' },
      { path: '/dashboard/insights', testid: 'dashboard-insights' },
      { path: '/dashboard/settings', testid: 'dashboard-settings' },
    ] as const

    for (const { path, testid } of cases) {
      const { unmount } = renderAt(path)
      expect(await screen.findByTestId('dashboard-sidebar', {}, lazyRouteWait)).toBeInTheDocument()
      expect(screen.queryByTestId('public-footer')).not.toBeInTheDocument()
      expect(await screen.findByTestId(testid, {}, lazyRouteWait)).toBeInTheDocument()
      unmount()
    }
  })

  it('exposes a working language switcher on /demo route-owned chrome', async () => {
    const user = userEvent.setup()
    renderAt('/demo')

    expect(
      await screen.findByRole('heading', { name: 'See SyncRevenue in action.' }, lazyRouteWait),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /EN/i }))
    await user.click(screen.getByRole('menuitemradio', { name: /PT-BR/i }))

    expect(
      await screen.findByRole('heading', { name: 'Veja o SyncRevenue em ação.' }, lazyRouteWait),
    ).toBeInTheDocument()
  })

  it('updates dashboard route copy after locale changes', async () => {
    renderAt('/dashboard/recovery')

    expect(screen.getByRole('group', { name: 'Select language' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Revenue Recovery' }, lazyRouteWait)).toBeInTheDocument()

    await act(async () => {
      await i18next.changeLanguage('es')
      useLocaleStore.setState({ locale: 'es' })
    })

    expect(
      await screen.findByRole('heading', { name: 'Recuperación de ingresos' }, lazyRouteWait),
    ).toBeInTheDocument()
  })
})
