import { useDocumentMeta } from '@/components/SEO'

/**
 * Story 7.2 (AC 5): Placeholder for the Insights dashboard page, mounted
 * at `/dashboard/insights`. Full body — analytics charts, segment
 * breakdowns — lands in Story 7.3.
 */
export default function Insights() {
  useDocumentMeta({
    titleKey: 'seo.dashboard.insights.title',
    descriptionKey: 'seo.dashboard.insights.description',
    ogTitleKey: 'seo.dashboard.insights.ogTitle',
    ogDescriptionKey: 'seo.dashboard.insights.ogDescription',
    path: '/dashboard/insights',
  })

  return (
    <div data-testid="dashboard-insights-placeholder">
      <h1 className="text-2xl font-semibold mb-2">Insights</h1>
      <p className="text-sm text-white/70">Coming in Story 7.3 — Dashboard pages.</p>
    </div>
  )
}
