import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { seedAdminUser } from '../../server/db.seed'
import { adminLoginAttemptsDao } from '../../server/dao/admin-login-attempts.dao'

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

const PUBLIC_ROUTES = ['/', '/privacy']
const ADMIN_ROUTES = ['/admin/dashboard', '/admin/leads', '/admin/team']
const TEST_EMAIL = process.env.ADMIN_TEST_EMAIL ?? 'admin-a11y-e2e@example.com'
const TEST_PASSWORD = process.env.ADMIN_TEST_PASSWORD ?? 'admin-a11y-e2e-password'

async function scanPage(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  const blockingViolations = results.violations.filter(v =>
    v.impact === 'critical' || v.impact === 'serious'
  )

  expect(
    blockingViolations,
    blockingViolations.map(v => `${v.id} (${v.impact}): ${v.description}`).join('\n')
  ).toEqual([])
}

async function mockAdminApis(page: Page) {
  await page.route('**/api/admin/auth/me', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { adminId: 1, email: TEST_EMAIL } }),
    })
  )
  await page.route('**/api/admin/dashboard/stats', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          totalLeads: 3,
          pendingLeads: 1,
          contactedLeads: 1,
          qualifiedLeads: 1,
          leadsThisWeek: 2,
          leadsByLocale: { en: 1, 'pt-BR': 1, es: 1 },
        },
      }),
    })
  )
  await page.route('**/api/admin/leads**', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [], total: 0 }),
    })
  )
  await page.route('**/api/admin/team', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    })
  )
}

test.beforeAll(() => {
  adminLoginAttemptsDao.reset(TEST_EMAIL)
  seedAdminUser({ email: TEST_EMAIL, password: TEST_PASSWORD })
})

for (const route of PUBLIC_ROUTES) {
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
      await scanPage(page)
    })
  }
}

test('@P1 axe scan on /admin/login', async ({ page }) => {
  await page.goto('/admin/login', { waitUntil: 'networkidle' })
  await scanPage(page)
})

for (const route of ADMIN_ROUTES) {
  test(`@P1 axe scan on authenticated ${route}`, async ({ page }) => {
    await mockAdminApis(page)
    await page.goto(route, { waitUntil: 'networkidle' })
    await scanPage(page)
  })
}
