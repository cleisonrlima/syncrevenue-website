import { lazy, Suspense } from 'react'
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
import DashboardLayout from '@/components/layout/DashboardLayout'

// Story 7.4 architectural follow-up (Story 7.7 owned originally — pulled
// forward to unblock `npm run build`): the Epic 7 Wave 3 pages each pull in
// a heavyweight side-effect at module-load time that broke the SSG prerender
// pipeline (`scripts/prerender.tsx` imports App which transitively imported
// `slick-carousel/slick/slick.css` — tsx cannot parse CSS in Node) AND
// inflated the public `/` initial bundle for visitors who never visit them.
//
// Switching all Wave 3 routes to `React.lazy()` defers their module
// evaluation (and side-effectful CSS / heavy graphing libs) to the moment a
// user actually navigates to the route. Side benefits:
//   - `npm run build` succeeds because Landing.tsx is no longer eagerly
//     imported by the prerender step (it just sees the import expression as
//     a static analysis hint).
//   - Initial `/` bundle drops dramatically — recharts (~150 KB), react-slick
//     (~50 KB), and the dashboard sub-component tree (~50 KB) all move into
//     their own chunks.
//   - The dashboard sidebar (rendered by `DashboardLayout`) stays interactive
//     while a child route chunk loads (Suspense fallback only swaps the
//     Outlet body, not the layout chrome).
//
// Lazy split-points NOT touched:
//   - `Home`, `Privacy`, `NotFound` — these are the prerender path and the
//     public chrome routes; keeping them eager preserves the Story 5.6 LCP
//     work (SSG HTML must reference these synchronously).
//   - `AdminLayout` + the admin tree — admin chunks are already small and
//     authenticated routes don't have the same first-paint pressure.
const Landing = lazy(() => import('@/pages/Landing'))
const Demo = lazy(() => import('@/pages/Demo'))
const DashboardHome = lazy(() => import('@/pages/dashboard/DashboardHome'))
const RevenueRecovery = lazy(() => import('@/pages/dashboard/RevenueRecovery'))
const Payouts = lazy(() => import('@/pages/dashboard/Payouts'))
const Insights = lazy(() => import('@/pages/dashboard/Insights'))
const Settings = lazy(() => import('@/pages/dashboard/Settings'))

function RouteLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen bg-[#0A0A0A] text-slate-300 flex items-center justify-center"
    >
      Loading...
    </div>
  )
}

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
      <main id="main-content" tabIndex={-1} className={mainClassName}>
        <ErrorBoundary key={normalizedPathname}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/privacy" element={<Privacy />} />
            {/* Story 7.2 (AC 1) / Story 7.4: Epic 7 public surfaces.
                Lazy-loaded — see top-of-file rationale. */}
            <Route
              path="/v2"
              element={
                <Suspense fallback={<RouteLoading />}>
                  <Landing />
                </Suspense>
              }
            />
            <Route
              path="/demo"
              element={
                <Suspense fallback={<RouteLoading />}>
                  <Demo />
                </Suspense>
              }
            />
            {/* Story 7.2 (AC 1, 2) / Story 7.3: Epic 7 dashboard suite.
                DashboardLayout renders the sidebar + header eagerly; each
                child route chunk loads on demand. The Suspense boundary is
                scoped to the Outlet body so the layout chrome stays
                interactive during chunk fetch. */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route
                index
                element={
                  <Suspense fallback={null}>
                    <DashboardHome />
                  </Suspense>
                }
              />
              <Route
                path="recovery"
                element={
                  <Suspense fallback={null}>
                    <RevenueRecovery />
                  </Suspense>
                }
              />
              <Route
                path="payouts"
                element={
                  <Suspense fallback={null}>
                    <Payouts />
                  </Suspense>
                }
              />
              <Route
                path="insights"
                element={
                  <Suspense fallback={null}>
                    <Insights />
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={
                  <Suspense fallback={null}>
                    <Settings />
                  </Suspense>
                }
              />
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
