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

export default function App() {
  const location = useLocation()
  const isHomeRoute = location.pathname === '/'

  return (
    <>
      <ScrollRestoration />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-brand-navy focus:rounded focus:font-semibold"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className={isHomeRoute ? 'scroll-mt-16' : 'pt-16 scroll-mt-16'}>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/privacy" element={<Privacy />} />
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
      <Footer />
    </>
  )
}
