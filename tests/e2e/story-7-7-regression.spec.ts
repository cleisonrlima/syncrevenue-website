import { test, expect } from './fixtures'
import type { Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const ARTIFACT_DIR = path.resolve(
  process.cwd(),
  '_bmad-output/test-artifacts/dark-mode-regression-epic-7/screenshots'
)
const TEST_EMAIL = process.env.ADMIN_TEST_EMAIL ?? 'admin-story-7-7-e2e@example.com'
const TEST_PASSWORD = process.env.ADMIN_TEST_PASSWORD ?? 'admin-story-7-7-e2e-password'
const MAX_SCREENSHOT_DIMENSION = 32_767

async function canCaptureFullPage(page: Page) {
  const dimensions = await page.evaluate(() => {
    const doc = document.documentElement
    const body = document.body

    return {
      width: Math.max(doc.scrollWidth, body.scrollWidth, doc.clientWidth),
      height: Math.max(doc.scrollHeight, body.scrollHeight, doc.clientHeight),
      deviceScaleFactor: window.devicePixelRatio || 1,
    }
  })

  return (
    dimensions.width * dimensions.deviceScaleFactor <= MAX_SCREENSHOT_DIMENSION &&
    dimensions.height * dimensions.deviceScaleFactor <= MAX_SCREENSHOT_DIMENSION
  )
}

async function saveScreenshot(page: Page, fileName: string) {
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, fileName),
    fullPage: await canCaptureFullPage(page),
  })
}

async function capture(page: Page, route: string, fileName: string) {
  await page.goto(route, { waitUntil: 'networkidle' })
  await expect(page.locator('body')).toBeVisible()
  await saveScreenshot(page, fileName)
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

test.describe('Story 7.7 dark-mode screenshot evidence', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(({ e2eDb }) => {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true })
    e2eDb.resetAdminLoginAttempts(TEST_EMAIL)
    e2eDb.seedAdminUser({ email: TEST_EMAIL, password: TEST_PASSWORD })
  })

  test('captures public and admin route screenshots', async ({ page }) => {
    await capture(page, '/', 'home.png')
    await capture(page, '/privacy', 'privacy.png')

    await page.goto('/admin/login', { waitUntil: 'networkidle' })
    await saveScreenshot(page, 'admin-login.png')

    await page.getByLabel(/email/i).fill('admin-story-7-7-invalid@example.com')
    await page.getByLabel(/password|senha|contraseña/i).fill('wrong-password')
    await page.getByRole('button', { name: /sign in|entrar|iniciar sesión/i }).click()
    await expect(page.getByTestId('admin-login-error')).toBeVisible()
    await saveScreenshot(page, 'admin-login-error.png')

    await mockAdminApis(page)
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' })
    await saveScreenshot(page, 'admin-dashboard.png')

    await capture(page, '/admin/leads', 'admin-leads.png')
    await capture(page, '/admin/team', 'admin-team.png')
  })
})
