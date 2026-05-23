import { useDocumentMeta } from '@/components/SEO'

/**
 * Story 7.2 (AC 5): Placeholder for the Figma 'teste' Landing page,
 * mounted at `/v2`. The full body lands in Story 7.4 (Landing + DemoForm).
 *
 * The route path `/v2` is locked at story-create time per Epic 7
 * decision 1; if the team later picks `/preview` the path becomes a 1-line
 * rename + a redirect entry in `src/App.tsx`.
 *
 * `useDocumentMeta` uses scoped i18n keys with `defaultValue` fallbacks so
 * tests don't break before Story 7.5 extracts the real copy.
 */
export default function Landing() {
  useDocumentMeta({
    titleKey: 'seo.landing.title',
    descriptionKey: 'seo.landing.description',
    ogTitleKey: 'seo.landing.ogTitle',
    ogDescriptionKey: 'seo.landing.ogDescription',
    path: '/v2',
  })

  return (
    <section className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-3xl font-semibold mb-3" data-testid="landing-placeholder-heading">
          Landing (v2)
        </h1>
        <p className="text-sm text-white/70">
          Coming in Story 7.4 — Landing + DemoForm pages.
        </p>
      </div>
    </section>
  )
}
