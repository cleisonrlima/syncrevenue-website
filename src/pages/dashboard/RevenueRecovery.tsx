import { useDocumentMeta } from '@/components/SEO'

/**
 * Story 7.2 (AC 5): Placeholder for the Revenue Recovery dashboard page,
 * mounted at `/dashboard/recovery`. Full body — recovery queue table,
 * dispute workflow — lands in Story 7.3.
 */
export default function RevenueRecovery() {
  useDocumentMeta({
    titleKey: 'seo.dashboard.recovery.title',
    descriptionKey: 'seo.dashboard.recovery.description',
    ogTitleKey: 'seo.dashboard.recovery.ogTitle',
    ogDescriptionKey: 'seo.dashboard.recovery.ogDescription',
    path: '/dashboard/recovery',
  })

  return (
    <div data-testid="dashboard-recovery-placeholder">
      <h1 className="text-2xl font-semibold mb-2">Revenue Recovery</h1>
      <p className="text-sm text-white/70">Coming in Story 7.3 — Dashboard pages.</p>
    </div>
  )
}
