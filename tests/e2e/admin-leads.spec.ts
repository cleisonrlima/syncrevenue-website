import { test, expect } from './fixtures'
import type { E2eDb, LeadStatus, Locale } from './fixtures'

const TEST_EMAIL = process.env.ADMIN_TEST_EMAIL ?? 'admin-leads-e2e@example.com'
const TEST_PASSWORD = process.env.ADMIN_TEST_PASSWORD ?? 'admin-leads-e2e-password'

interface SeedLead {
  name: string
  email: string
  company: string
  role: string
  gds: 'Amadeus' | 'Sabre' | 'Galileo' | 'Worldspan' | 'Other' | 'None yet'
  message: string
  locale: Locale
  status: LeadStatus
}

const SEED_LEADS: SeedLead[] = [
  { name: 'Alice EN E2E', email: 'alice-e2e@a.com', company: 'AcmeCo', role: 'Owner', gds: 'Amadeus', message: 'hello en', locale: 'en', status: 'pending' },
  { name: 'Bruno PT E2E', email: 'bruno-e2e@b.com', company: 'BetaCo', role: 'Finance', gds: 'Sabre', message: 'oi pt', locale: 'pt-BR', status: 'pending' },
  { name: 'Clara PT E2E', email: 'clara-e2e@c.com', company: 'GammaCo', role: 'Owner', gds: 'Galileo', message: 'oi pt 2', locale: 'pt-BR', status: 'contacted' },
  { name: 'Diego ES E2E', email: 'diego-e2e@d.com', company: 'DeltaCo', role: 'Operations', gds: 'Worldspan', message: 'hola es', locale: 'es', status: 'qualified' },
]

const SEED_EMAILS = SEED_LEADS.map(s => s.email)

function purgeSeedLeads(e2eDb: E2eDb) {
  e2eDb.deleteLeadsByEmails(SEED_EMAILS)
}

function insertSeedLeads(e2eDb: E2eDb) {
  for (const seed of SEED_LEADS) {
    e2eDb.seedLead({
      name: seed.name,
      email: seed.email,
      company: seed.company,
      role: seed.role,
      gds: seed.gds,
      message: seed.message,
      locale: seed.locale,
      status: seed.status,
    })
  }
}

test.describe('Admin Leads @P1', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(({ e2eDb }) => {
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

  test('authed /admin/leads renders rows from seeded demo_requests', async ({ page }) => {
    await login(page)
    await page.goto('/admin/leads')

    const table = page.getByTestId('admin-leads-table')
    await expect(table).toBeVisible()
    for (const seed of SEED_LEADS) {
      await expect(table).toContainText(seed.name)
    }
  })

  test('locale filter narrows to PT-BR rows', async ({ page }) => {
    await login(page)
    await page.goto('/admin/leads')
    await page.getByTestId('admin-leads-table').waitFor()

    await page.getByTestId('admin-leads-locale-filter').selectOption('pt-BR')

    const table = page.getByTestId('admin-leads-table')
    await expect(table).toContainText('Bruno PT E2E')
    await expect(table).toContainText('Clara PT E2E')
    await expect(table).not.toContainText('Alice EN E2E')
    await expect(table).not.toContainText('Diego ES E2E')
  })

  test('status filter narrows to pending rows', async ({ page }) => {
    await login(page)
    await page.goto('/admin/leads')
    await page.getByTestId('admin-leads-table').waitFor()

    await page.getByTestId('admin-leads-status-filter').selectOption('pending')

    const table = page.getByTestId('admin-leads-table')
    await expect(table).toContainText('Alice EN E2E')
    await expect(table).toContainText('Bruno PT E2E')
    await expect(table).not.toContainText('Clara PT E2E')
    await expect(table).not.toContainText('Diego ES E2E')
  })

  test('Clear filters restores the full set when filters return zero results', async ({ page }) => {
    await login(page)
    await page.goto('/admin/leads')
    await page.getByTestId('admin-leads-table').waitFor()

    // PT-BR + qualified intersection is empty in seed → filtered empty state
    await page.getByTestId('admin-leads-locale-filter').selectOption('pt-BR')
    await page.getByTestId('admin-leads-status-filter').selectOption('qualified')

    const empty = page.getByTestId('admin-leads-empty')
    await expect(empty).toBeVisible()
    await page.getByTestId('admin-leads-clear-filters').click()

    const table = page.getByTestId('admin-leads-table')
    await expect(table).toBeVisible()
    for (const seed of SEED_LEADS) {
      await expect(table).toContainText(seed.name)
    }
  })

  test('empty DB shows the no-leads-yet text', async ({ page, e2eDb }) => {
    purgeSeedLeads(e2eDb)
    await login(page)
    await page.goto('/admin/leads')

    const empty = page.getByTestId('admin-leads-empty')
    await expect(empty).toBeVisible()
    await expect(empty).toContainText(/no leads yet|nenhum lead ainda|aún no hay leads/i)
  })

  test('inline status mutation updates badge without navigation and persists across reload', async ({ page, e2eDb }) => {
    await login(page)
    await page.goto('/admin/leads')
    await page.getByTestId('admin-leads-table').waitFor()

    const pendingSeed = SEED_LEADS.find(s => s.status === 'pending' && s.name === 'Alice EN E2E')!
    const dbRow = e2eDb.findLeadByEmail(pendingSeed.email)
    expect(dbRow?.id).toBeGreaterThan(0)
    const rowId = dbRow!.id

    const badge = page.getByTestId(`lead-status-${rowId}`)
    const select = page.getByTestId(`lead-status-select-${rowId}`)
    await expect(badge).toHaveText(/pending/i)

    const beforeUrl = page.url()
    await select.selectOption('contacted')
    await expect(badge).toHaveText(/contacted/i)
    expect(page.url()).toBe(beforeUrl)

    // Durability: reload the page, the new status must persist
    await page.reload()
    await page.getByTestId('admin-leads-table').waitFor()
    await expect(page.getByTestId(`lead-status-${rowId}`)).toHaveText(/contacted/i)
  })
})
