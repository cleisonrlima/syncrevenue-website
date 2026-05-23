import { useDocumentMeta } from '@/components/SEO'

/**
 * Story 7.2 (AC 5): Placeholder for the Figma 'teste' DemoForm page,
 * mounted at `/demo`. The full body lands in Story 7.4.
 *
 * Like `/v2`, this surface renders WITHOUT the public Navbar + Footer
 * because the Figma DemoForm source includes its own minimal nav chrome
 * (see App.tsx `isFigmaPublicRoute` guard).
 */
export default function Demo() {
  useDocumentMeta({
    titleKey: 'seo.demo.title',
    descriptionKey: 'seo.demo.description',
    ogTitleKey: 'seo.demo.ogTitle',
    ogDescriptionKey: 'seo.demo.ogDescription',
    path: '/demo',
  })

  return (
    <section className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-3xl font-semibold mb-3" data-testid="demo-placeholder-heading">
          Demo
        </h1>
        <p className="text-sm text-white/70">
          Coming in Story 7.4 — Landing + DemoForm pages.
        </p>
      </div>
    </section>
  )
}
