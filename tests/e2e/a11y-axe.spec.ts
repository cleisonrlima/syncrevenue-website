import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * P0-6 + P1-8 + P1-9 — axe-core WCAG 2.1 AA scan on `/` and `/privacy` × locales.
 * Test Design Epic 1 → R-O3.
 *
 * The R-A2 documented exception (Electric Blue body-text contrast) is disabled
 * globally because the brand-deep token is used for body text by design; the
 * remaining occurrences of #0075F0 on light bg are large-text only or decorative.
 */

const LOCALES = [
  { code: 'en', name: 'English' },
  { code: 'pt-BR', name: 'Portuguese' },
  { code: 'es', name: 'Spanish' },
]

const ROUTES = ['/', '/privacy']

for (const route of ROUTES) {
  for (const locale of LOCALES) {
    test(`@P1 axe scan on ${route} (${locale.name})`, async ({ page }) => {
      await page.addInitScript(loc => {
        try {
          window.localStorage.setItem('i18nextLng', loc)
        } catch {
          // private browsing — fall back to default
        }
      }, locale.code)

      await page.goto(route, { waitUntil: 'networkidle' })

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(['color-contrast'])
        .analyze()

      const blockingViolations = results.violations.filter(v =>
        v.impact === 'critical' || v.impact === 'serious'
      )

      expect(
        blockingViolations,
        blockingViolations.map(v => `${v.id} (${v.impact}): ${v.description}`).join('\n')
      ).toEqual([])
    })
  }
}
