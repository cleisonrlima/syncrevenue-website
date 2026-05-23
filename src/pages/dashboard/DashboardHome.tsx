import { useDocumentMeta } from '@/components/SEO'

/**
 * Story 7.2 (AC 5): Placeholder for the dashboard Overview (index) page,
 * mounted at `/dashboard`. The full body — KPI cards, recovery chart,
 * recent activity list — lands in Story 7.3 (Dashboard pages).
 */
export default function DashboardHome() {
  useDocumentMeta({
    titleKey: 'seo.dashboard.home.title',
    descriptionKey: 'seo.dashboard.home.description',
    ogTitleKey: 'seo.dashboard.home.ogTitle',
    ogDescriptionKey: 'seo.dashboard.home.ogDescription',
    path: '/dashboard',
  })

  return (
    <div data-testid="dashboard-home-placeholder">
      <h1 className="text-2xl font-semibold mb-2">Overview</h1>
      <p className="text-sm text-white/70">Coming in Story 7.3 — Dashboard pages.</p>
    </div>
  )
}
