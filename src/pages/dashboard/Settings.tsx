import { useDocumentMeta } from '@/components/SEO'

/**
 * Story 7.2 (AC 5): Placeholder for the Settings dashboard page, mounted
 * at `/dashboard/settings`. Full body — profile, billing, integrations —
 * lands in Story 7.3. Real user state wiring (replacing the placeholder
 * user card in DashboardLayout) is a later epic.
 */
export default function Settings() {
  useDocumentMeta({
    titleKey: 'seo.dashboard.settings.title',
    descriptionKey: 'seo.dashboard.settings.description',
    ogTitleKey: 'seo.dashboard.settings.ogTitle',
    ogDescriptionKey: 'seo.dashboard.settings.ogDescription',
    path: '/dashboard/settings',
  })

  return (
    <div data-testid="dashboard-settings-placeholder">
      <h1 className="text-2xl font-semibold mb-2">Settings</h1>
      <p className="text-sm text-white/70">Coming in Story 7.3 — Dashboard pages.</p>
    </div>
  )
}
