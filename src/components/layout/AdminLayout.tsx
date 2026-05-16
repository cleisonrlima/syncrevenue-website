import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdmin } from '@/hooks/useAdmin'

export default function AdminLayout() {
  const location = useLocation()
  const { isAuthenticated, bootstrapped, bootstrap } = useAdmin()

  useEffect(() => {
    document
      .querySelectorAll(
        [
          'meta[name="description"]',
          'meta[property^="og:"]',
          'link[rel="canonical"]',
          'link[rel="alternate"][hreflang]',
        ].join(',')
      )
      .forEach(element => element.remove())
    document.title = 'Sync Sirius Admin'
  }, [])

  useEffect(() => {
    if (!bootstrapped) {
      void bootstrap()
    }
  }, [bootstrapped, bootstrap])

  if (!bootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-navy">
        <div
          role="status"
          aria-label="Loading admin session"
          aria-busy="true"
          aria-live="polite"
          className="h-12 w-48 motion-safe:animate-pulse rounded-md bg-brand-slate/60"
        >
          <span className="sr-only">Loading admin session...</span>
        </div>
      </div>
    )
  }

  const onLoginRoute = location.pathname === '/admin/login'

  if (!isAuthenticated && !onLoginRoute) {
    return <Navigate to="/admin/login" replace />
  }

  if (isAuthenticated && onLoginRoute) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-brand-navy text-white">
      <Outlet />
    </div>
  )
}
