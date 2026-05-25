import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Landing from '@/pages/Landing'
import Privacy from '@/pages/Privacy'
import NotFound from '@/pages/NotFound'
import AdminLayout from '@/components/layout/AdminLayout'
import Login from '@/pages/admin/Login'
import Dashboard from '@/pages/admin/Dashboard'
import Leads from '@/pages/admin/Leads'
import Team from '@/pages/admin/Team'
import ErrorBoundary from '@/components/ErrorBoundary'
import ScrollRestoration from '@/components/ScrollRestoration'

// LandingV2, Demo, Dashboard, and Settings are lazy-loaded to keep the
// initial bundle lean — these pull in slick-carousel CSS, recharts, and
// other heavy side-effect deps that would break the SSG prerender step
// (`scripts/prerender.tsx` runs in Node and cannot parse CSS imports).
// Landing (the `/` public page) is eager so `renderToString` in the
// prerender script can render it synchronously for LCP prerendering.
const LandingV2 = lazy(() => import('@/pages/LandingV2'))
const Demo = lazy(() => import('@/pages/Demo'))
const DashboardLayout = lazy(() => import('@/components/layout/DashboardLayout'))
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
  // Story 7.2 (AC 3, 4): Suppress the public Navbar + Footer on surfaces
  // that own their own chrome:
  //   - `/` (Landing) ships its own dark <nav> and footer
  //   - `/dashboard/*` is wrapped by DashboardLayout (sidebar + header)
  //   - `/demo` (DemoForm) ships its own minimal nav in the Figma source
  // ScrollRestoration + skip-to-content link + the <main> wrapper stay
  // global — they continue to work on every route, public chrome or not.
  const isDashboardRoute = normalizedPathname === '/dashboard' || normalizedPathname.startsWith('/dashboard/')
  const isFigmaPublicRoute = normalizedPathname === '/' || normalizedPathname === '/demo'
  const showPublicChrome =
    normalizedPathname === '/privacy' ||
    normalizedPathname === '/admin' ||
    normalizedPathname.startsWith('/admin/')

  // Public-chrome routes get `pt-16` to clear the filled sticky navbar.
  // Landing and dashboard surfaces own their own headers so no top padding.
  const mainClassName = showPublicChrome ? 'pt-16 scroll-mt-16' : 'scroll-mt-16'

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
            <Route
              path="/"
              element={
                <Suspense fallback={<RouteLoading />}>
                  <Landing />
                </Suspense>
              }
            />
            <Route
              path="/v2"
              element={
                <Suspense fallback={<RouteLoading />}>
                  <LandingV2 />
                </Suspense>
              }
            />
            <Route path="/privacy" element={<Privacy />} />
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
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<RouteLoading />}>
                  <DashboardLayout />
                </Suspense>
              }
            >
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
