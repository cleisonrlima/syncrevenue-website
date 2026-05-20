import { useEffect } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAdmin } from '@/hooks/useAdmin'

export default function AdminLayout() {
  const location = useLocation()
  const { t } = useTranslation()
  const { isAuthenticated, bootstrapped, bootstrap, logout } = useAdmin()

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

  const showNav = bootstrapped && isAuthenticated && !onLoginRoute

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'text-white border-b-2 border-white pb-1'
      : 'text-white/70 hover:text-white pb-1'

  return (
    <div className="min-h-screen bg-brand-navy text-white">
      {showNav ? (
        <header role="banner" className="border-b border-white/10 bg-brand-navy/80">
          <nav
            role="navigation"
            aria-label={t('admin.nav.label', { defaultValue: 'Admin navigation' })}
            data-testid="admin-nav"
            className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4"
          >
            <div className="flex flex-wrap items-center gap-4">
              <span
                data-testid="admin-nav-brand"
                className="shrink-0 text-sm font-semibold uppercase tracking-wide text-white"
              >
                {t('admin.nav.brand', { defaultValue: 'Sync Sirius Admin' })}
              </span>
              <ul className="flex flex-wrap items-center gap-4 text-sm">
                <li>
                  <NavLink
                    to="/admin/dashboard"
                    end
                    data-testid="admin-nav-dashboard"
                    className={navLinkClass}
                    aria-current={location.pathname === '/admin/dashboard' ? 'page' : undefined}
                  >
                    {t('admin.nav.dashboard', { defaultValue: 'Dashboard' })}
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/admin/leads"
                    end
                    data-testid="admin-nav-leads"
                    className={navLinkClass}
                    aria-current={location.pathname === '/admin/leads' ? 'page' : undefined}
                  >
                    {t('admin.nav.leads', { defaultValue: 'Leads' })}
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/admin/team"
                    end
                    data-testid="admin-nav-team"
                    className={navLinkClass}
                    aria-current={location.pathname === '/admin/team' ? 'page' : undefined}
                  >
                    {t('admin.nav.team', { defaultValue: 'Team' })}
                  </NavLink>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              data-testid="admin-nav-logout"
              className="shrink-0 rounded-md border border-white/30 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              {t('admin.logout', { defaultValue: 'Log out' })}
            </button>
          </nav>
        </header>
      ) : null}
      <Outlet />
    </div>
  )
}
