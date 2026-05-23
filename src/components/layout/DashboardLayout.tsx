import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Target,
  CreditCard,
  BarChart2,
  Settings as SettingsIcon,
  Bell,
  Search,
} from 'lucide-react'
import ImageWithFallback from '@/components/figma/ImageWithFallback'
import { cn } from '@/lib/cn'

/**
 * Story 7.2 (AC 2): `DashboardLayout` — the Epic 7 dashboard shell.
 *
 * Source: Figma Make file `66Wb2MAv5PLOBSJLoFM3E3`, component
 * `src/app/pages/DashboardLayout.tsx`. Authored from the AC2 spec because
 * the Figma MCP `ReadMcpResourceTool` transport was disconnected during
 * this session — `get_design_context` returned only resource link
 * descriptors with no inline TSX, and `get_screenshot` /
 * `get_variable_defs` / `get_metadata` are explicitly unsupported for
 * Figma Make files (per server documentation). The structural contract
 * (sidebar nav items, header chrome, footer user card) is fully specified
 * in the story AC2 and is what this file implements.
 *
 * Layout structure:
 *   - 256 px (w-64) fixed left sidebar on lg+ screens with:
 *       header — logo + product name
 *       nav    — 5 NavLink items: Overview / Revenue Recovery /
 *                Payouts / Insights / Settings (lucide icons + label)
 *       footer — user card (initials avatar + name + email)
 *   - Main column:
 *       header — search input (left) + bell button + "Import Statement"
 *                primary CTA (right)
 *       body   — <Outlet /> for the dashboard child routes
 *
 * Coexists with `AdminLayout` (Epic 4) — Epic 7 decision 3. Do not
 * collapse the two. The lucide `Settings` icon is imported as
 * `SettingsIcon` to avoid colliding with future page-level `Settings`
 * components (dev note 4).
 *
 * Subsequent stories (7.3 dashboard pages, 7.4 landing/demo) fill in the
 * <Outlet /> body; this story only ships the scaffold and a placeholder
 * for each route.
 */

type NavItem = {
  to: string
  labelKey: string
  defaultLabel: string
  Icon: typeof LayoutDashboard
}

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { to: '/dashboard', labelKey: 'dashboard.nav.overview', defaultLabel: 'Overview', Icon: LayoutDashboard },
  { to: '/dashboard/recovery', labelKey: 'dashboard.nav.recovery', defaultLabel: 'Revenue Recovery', Icon: Target },
  { to: '/dashboard/payouts', labelKey: 'dashboard.nav.payouts', defaultLabel: 'Payouts', Icon: CreditCard },
  { to: '/dashboard/insights', labelKey: 'dashboard.nav.insights', defaultLabel: 'Insights', Icon: BarChart2 },
  { to: '/dashboard/settings', labelKey: 'dashboard.nav.settings', defaultLabel: 'Settings', Icon: SettingsIcon },
]

// Inline placeholder user card values. Story 7.6/Settings page will swap
// these for real user state in a later epic — for now Figma's placeholders
// are good enough to validate the layout.
const USER_PLACEHOLDER = {
  initials: 'JD',
  name: 'John Doe',
  email: 'john@company.com',
} as const

export default function DashboardLayout() {
  const location = useLocation()

  const isOverviewActive = location.pathname === '/dashboard'

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex" data-testid="dashboard-layout-root">
      {/* ---------- Sidebar ---------- */}
      <aside
        className="hidden lg:flex w-64 shrink-0 flex-col border-r border-white/10 bg-[rgba(8,8,32,0.85)]"
        aria-label="Dashboard navigation"
        data-testid="dashboard-sidebar"
      >
        <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10">
          <ImageWithFallback
            src="/logos/syncsirius-logo.png"
            alt="SyncSirius"
            width={32}
            height={32}
            className="h-8 w-auto block"
          />
          <span className="text-sm font-semibold text-white tracking-wide">SyncSirius</span>
        </div>

        <nav
          className="flex-1 px-3 py-4 flex flex-col gap-1"
          role="navigation"
          aria-label="Dashboard primary navigation"
          data-testid="dashboard-sidebar-nav"
        >
          {NAV_ITEMS.map(({ to, labelKey, defaultLabel, Icon }) => {
            // NavLink's `end` flag — only the `/dashboard` index route should
            // strict-match; nested routes (`/dashboard/recovery` etc.) match
            // normally. Without `end`, the Overview item would stay active on
            // every nested page.
            const exact = to === '/dashboard'
            return (
              <NavLink
                key={to}
                to={to}
                end={exact}
                data-testid={`dashboard-nav-${to.split('/').pop() || 'overview'}`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium motion-safe:transition-colors motion-safe:duration-150 min-h-[40px]',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/5',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span data-i18n-key={labelKey}>{defaultLabel}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3" data-testid="dashboard-user-card">
            <div
              className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white"
              aria-hidden="true"
            >
              {USER_PLACEHOLDER.initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-white truncate">{USER_PLACEHOLDER.name}</span>
              <span className="text-xs text-white/60 truncate">{USER_PLACEHOLDER.email}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ---------- Main column ---------- */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="h-16 border-b border-white/10 bg-[rgba(8,8,32,0.6)] flex items-center justify-between gap-4 px-4 sm:px-6"
          role="banner"
          data-testid="dashboard-header"
        >
          <div className="flex-1 max-w-md">
            <label htmlFor="dashboard-search" className="sr-only">
              Search dashboard
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" aria-hidden="true" />
              <input
                id="dashboard-search"
                type="search"
                placeholder="Search..."
                data-testid="dashboard-search-input"
                className="w-full h-9 rounded-md bg-white/5 border border-white/10 pl-9 pr-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="View notifications"
              data-testid="dashboard-bell-button"
              className="h-9 w-9 rounded-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 motion-safe:transition-colors motion-safe:duration-150"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              data-testid="dashboard-import-cta"
              className="h-9 rounded-md bg-[var(--accent)] text-[var(--accent-foreground)] px-4 text-sm font-medium motion-safe:transition-opacity motion-safe:duration-150 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
            >
              Import Statement
            </button>
          </div>
        </header>

        <main
          id="dashboard-main"
          className={cn(
            'flex-1 p-4 sm:p-6 lg:p-8',
            // Story 7.2: scroll-mt-16 mirrors the sibling main wrapper in
            // src/App.tsx so any hash-anchor scrolling inside dashboard pages
            // doesn't disappear under the dashboard header.
            'scroll-mt-16',
          )}
          data-testid="dashboard-main"
          data-active-overview={isOverviewActive ? 'true' : undefined}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
