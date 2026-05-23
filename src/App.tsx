import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Home from '@/pages/Home'
import Privacy from '@/pages/Privacy'
import NotFound from '@/pages/NotFound'
import AdminLayout from '@/components/layout/AdminLayout'
import Login from '@/pages/admin/Login'
import Dashboard from '@/pages/admin/Dashboard'
import Leads from '@/pages/admin/Leads'
import Team from '@/pages/admin/Team'
import ErrorBoundary from '@/components/ErrorBoundary'
import ScrollRestoration from '@/components/ScrollRestoration'
// Story 7.2 (AC 1, 5): Epic 7 surfaces.
import Landing from '@/pages/Landing'
import Demo from '@/pages/Demo'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHome from '@/pages/dashboard/DashboardHome'
import RevenueRecovery from '@/pages/dashboard/RevenueRecovery'
import Payouts from '@/pages/dashboard/Payouts'
import Insights from '@/pages/dashboard/Insights'
import Settings from '@/pages/dashboard/Settings'

export default function App() {
  const location = useLocation()
  const normalizedPathname =
    location.pathname.length > 1 ? location.pathname.replace(/\/+$/, '') : location.pathname
  const isHomeRoute = normalizedPathname === '/'

  // Story 7.2 (AC 3, 4): Suppress the public Navbar + Footer on Epic 7
  // surfaces that own their own chrome:
  //   - `/dashboard/*` is wrapped by DashboardLayout (sidebar + header)
  //   - `/v2` (Landing) ships its own dark <nav> in the Figma source
  //   - `/demo` (DemoForm) ships its own minimal nav in the Figma source
  // ScrollRestoration + skip-to-content link + the <main> wrapper stay
  // global — they continue to work on every route, public chrome or not.
  const isDashboardRoute = normalizedPathname === '/dashboard' || normalizedPathname.startsWith('/dashboard/')
  const isFigmaPublicRoute = normalizedPathname === '/v2' || normalizedPathname === '/demo'
  const showPublicChrome =
    normalizedPathname === '/' ||
    normalizedPathname === '/privacy' ||
    normalizedPathname === '/admin' ||
    normalizedPathname.startsWith('/admin/')

  // Top padding rules:
  //   - Home (`/`) sits flush under the transparent overlay navbar
  //   - Other public-chrome routes get `pt-16` to clear the filled sticky navbar
  //   - Dashboard and Figma-public routes own their own headers / nav, so the
  //     wrapper does not add padding
  const mainClassName = showPublicChrome
    ? isHomeRoute
      ? 'scroll-mt-16'
      : 'pt-16 scroll-mt-16'
    : 'scroll-mt-16'

  return (
    <>
      <ScrollRestoration />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-brand-navy focus:rounded focus:font-semibold"
      >
        Skip to main content
      </a>
      {showPublicChrome ? <Navbar /> : null}
      <main id="main-content" className={mainClassName}>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/privacy" element={<Privacy />} />
            {/* Story 7.2 (AC 1): Epic 7 public surfaces (full bodies in Story 7.4). */}
            <Route path="/v2" element={<Landing />} />
            <Route path="/demo" element={<Demo />} />
            {/* Story 7.2 (AC 1, 2): Epic 7 dashboard suite (full bodies in Story 7.3). */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="recovery" element={<RevenueRecovery />} />
              <Route path="payouts" element={<Payouts />} />
              <Route path="insights" element={<Insights />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="login" replace />} />
              <Route path="login" element={<Login />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="leads" element={<Leads />} />
              <Route path="team" element={<Team />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </main>
      {showPublicChrome ? <Footer /> : null}
    </>
  )
}
