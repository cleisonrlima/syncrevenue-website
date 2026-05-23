import { useDocumentMeta } from '@/components/SEO'

/**
 * Story 7.2 (AC 5): Placeholder for the Payouts dashboard page, mounted
 * at `/dashboard/payouts`. Full body — payout schedule, history table —
 * lands in Story 7.3.
 */
export default function Payouts() {
  useDocumentMeta({
    titleKey: 'seo.dashboard.payouts.title',
    descriptionKey: 'seo.dashboard.payouts.description',
    ogTitleKey: 'seo.dashboard.payouts.ogTitle',
    ogDescriptionKey: 'seo.dashboard.payouts.ogDescription',
    path: '/dashboard/payouts',
  })

  return (
    <div data-testid="dashboard-payouts-placeholder">
      <h1 className="text-2xl font-semibold mb-2">Payouts</h1>
      <p className="text-sm text-white/70">Coming in Story 7.3 — Dashboard pages.</p>
    </div>
  )
}
