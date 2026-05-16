import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdmin } from '@/hooks/useAdmin'
import SectionSkeleton from '@/components/sections/SectionSkeleton'

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
        <SectionSkeleton label="Loading admin session" className="h-12 w-48" />
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
