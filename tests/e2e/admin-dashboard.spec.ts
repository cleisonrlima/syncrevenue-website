import { test, expect } from './fixtures'
import type { E2eDb } from './fixtures'

const TEST_EMAIL = process.env.ADMIN_TEST_EMAIL ?? 'admin-dashboard-e2e@example.com'
const TEST_PASSWORD = process.env.ADMIN_TEST_PASSWORD ?? 'admin-dashboard-e2e-password'

const SEED_EMAILS = [
  'dash-e2e-en@example.com',
  'dash-e2e-pt@example.com',
  'dash-e2e-es@example.com',
]

function purgeSeedLeads(e2eDb: E2eDb) {
  e2eDb.deleteLeadsByEmails(SEED_EMAILS)
}

function insertSeedLeads(e2eDb: E2eDb) {
  e2eDb.seedLead({
    name: 'Dashboard EN Lead',
    email: SEED_EMAILS[0],
    company: 'AcmeCo',
    phone: null,
    role: 'CEO',
    gds: 'Amadeus',
    message: null,
    locale: 'en',
  })
  e2eDb.seedLead({
    name: 'Dashboard PT Lead',
    email: SEED_EMAILS[1],
    company: 'BetaCo',
    phone: null,
    role: 'Director',
    gds: 'Sabre',
    message: null,
    locale: 'pt-BR',
  })
  e2eDb.seedLead({
    name: 'Dashboard ES Lead',
    email: SEED_EMAILS[2],
    company: 'GammaCo',
    phone: null,
    role: 'Director',
    gds: 'Galileo',
    message: null,
    locale: 'es',
  })
}

test.describe('Admin Dashboard @P1', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(({ e2eDb }) => {
    e2eDb.resetAdminLoginAttempts(TEST_EMAIL)
    e2eDb.seedAdminUser({ email: TEST_EMAIL, password: TEST_PASSWORD })
  })

  test.beforeEach(({ e2eDb }) => {
    purgeSeedLeads(e2eDb)
    insertSeedLeads(e2eDb)
  })

  test.afterAll(({ e2eDb }) => {
    purgeSeedLeads(e2eDb)
  })

  async function login(page: import('@playwright/test').Page) {
    await page.goto('/admin/login')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password|senha|contraseña/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in|entrar|iniciar sesión/i }).click()
    await page.waitForURL(/\/admin\/dashboard$/)
  }

  test('unauthenticated visit to /admin/dashboard redirects to /admin/login without admin API calls', async ({ page }) => {
    const adminRequests: string[] = []
    page.on('request', (req) => {
      const url = req.url()
      if (url.includes('/api/admin/leads') || url.includes('/api/admin/dashboard/stats')) {
        adminRequests.push(url)
      }
    })
    await page.goto('/admin/dashboard')
    await page.waitForURL(/\/admin\/login$/)
    expect(adminRequests).toEqual([])
  })

  test('authenticated admin navigates Dashboard / Leads / Team via the nav; aria-current updates', async ({ page }) => {
    await login(page)
    const nav = page.getByTestId('admin-nav')
    await expect(nav).toBeVisible()
    await expect(page.getByTestId('admin-nav-dashboard')).toHaveAttribute('aria-current', 'page')

    await page.getByTestId('admin-nav-leads').click()
    await page.waitForURL(/\/admin\/leads$/)
    await expect(page.getByTestId('admin-nav-leads')).toHaveAttribute('aria-current', 'page')

    await page.getByTestId('admin-nav-team').click()
    await page.waitForURL(/\/admin\/team$/)
    await expect(page.getByTestId('admin-nav-team')).toHaveAttribute('aria-current', 'page')

    await page.getByTestId('admin-nav-dashboard').click()
    await page.waitForURL(/\/admin\/dashboard$/)
    await expect(page.getByTestId('admin-nav-dashboard')).toHaveAttribute('aria-current', 'page')
  })

  test('authenticated admin clicks Logout from the nav on /admin/team → redirected to /admin/login, cookie cleared', async ({ page, context }) => {
    await login(page)
    await page.goto('/admin/team')
    await expect(page.getByTestId('admin-nav-logout')).toBeVisible()
    await page.getByTestId('admin-nav-logout').click()
    await page.waitForURL(/\/admin\/login$/)
    const cookies = await context.cookies()
    expect(cookies.find((c) => c.name === 'admin_token')).toBeUndefined()
  })

  test('Dashboard displays stat cards with numbers reflecting seeded demo_requests', async ({ page, e2eDb }) => {
    const expected = e2eDb.countLeadStats()
    await login(page)
    await expect(page.getByTestId('admin-dashboard-stats')).toBeVisible()
    await expect(page.getByTestId('admin-dashboard-card-total')).toContainText(
      String(expected.totalLeads)
    )
    await expect(page.getByTestId('admin-dashboard-card-pending')).toContainText(
      String(expected.pendingLeads)
    )
    await expect(page.getByTestId('admin-dashboard-card-thisweek')).toContainText(
      String(expected.leadsThisWeek)
    )
    await expect(page.getByTestId('admin-dashboard-locale-en')).toContainText(
      String(expected.leadsByLocale.en)
    )
    await expect(page.getByTestId('admin-dashboard-locale-pt-BR')).toContainText(
      String(expected.leadsByLocale['pt-BR'])
    )
    await expect(page.getByTestId('admin-dashboard-locale-es')).toContainText(
      String(expected.leadsByLocale.es)
    )
  })
})
