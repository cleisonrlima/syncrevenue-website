import { test, expect } from './fixtures'
import type { E2eDb } from './fixtures'

const TEST_EMAIL = process.env.ADMIN_TEST_EMAIL ?? 'admin-team-e2e@example.com'
const TEST_PASSWORD = process.env.ADMIN_TEST_PASSWORD ?? 'admin-team-e2e-password'

const SEED_NAMES = ['Team E2E Alpha', 'Team E2E Beta']

function purgeSeedTeam(e2eDb: E2eDb) {
  e2eDb.deleteTeamByNames(SEED_NAMES)
  // also wipe any rows the admin CRUD test creates so reruns stay clean
  e2eDb.deleteCreatedTeamMembers()
}

function insertSeedTeam(e2eDb: E2eDb) {
  e2eDb.seedTeamMember({
    name: SEED_NAMES[0],
    role_en: 'Lead EN',
    role_pt: 'Líder PT',
    role_es: 'Líder ES',
    bio_en: 'EN bio',
    bio_pt: 'PT bio: orienta operações',
    bio_es: 'ES bio',
    experience_en: '20+ years',
    experience_pt: '20+ anos',
    experience_es: '20+ años',
    photo_url: null,
    linkedin: null,
    order_index: 0,
    active: 1,
  })
  e2eDb.seedTeamMember({
    name: SEED_NAMES[1],
    role_en: 'Automation EN',
    role_pt: 'Automação PT',
    role_es: 'Automatización ES',
    bio_en: 'EN bio 2',
    bio_pt: 'PT bio 2',
    bio_es: 'ES bio 2',
    experience_en: '15+ years',
    experience_pt: '15+ anos',
    experience_es: '15+ años',
    photo_url: null,
    linkedin: null,
    order_index: 1,
    active: 1,
  })
}

test.describe('Admin Team @P1', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(({ e2eDb }) => {
    e2eDb.resetAdminLoginAttempts(TEST_EMAIL)
    e2eDb.seedAdminUser({ email: TEST_EMAIL, password: TEST_PASSWORD })
  })

  test.beforeEach(({ e2eDb }) => {
    purgeSeedTeam(e2eDb)
    insertSeedTeam(e2eDb)
  })

  test.afterAll(({ e2eDb }) => {
    purgeSeedTeam(e2eDb)
  })

  async function login(page: import('@playwright/test').Page) {
    await page.goto('/admin/login')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password|senha|contraseña/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in|entrar|iniciar sesión/i }).click()
    await page.waitForURL(/\/admin\/dashboard$/)
  }

  async function getLanguageSwitcher(page: import('@playwright/test').Page, isMobile: boolean) {
    if (isMobile) {
      await page.getByRole('button', { name: /open menu/i }).click()
      return page
        .getByRole('dialog', { name: /mobile navigation menu/i })
        .getByRole('group', { name: /select language/i })
    }

    return page.getByLabel(/main navigation/i).getByRole('group', { name: /select language/i })
  }

  async function selectLocale(
    switcher: import('@playwright/test').Locator,
    label: 'EN' | 'PT-BR' | 'ES'
  ) {
    await switcher.getByRole('button').click()
    await switcher.getByRole('menuitemradio', { name: label }).click()
    await expect(switcher.getByRole('button', { name: label })).toBeVisible()
  }

  test('admin can create, edit, and persist a team member', async ({ page }) => {
    await login(page)
    await page.goto('/admin/team')

    const table = page.getByTestId('admin-team-table')
    await expect(table).toBeVisible()
    await expect(table).toContainText(SEED_NAMES[0])

    await page.getByTestId('team-add').click()
    const created = `E2E Created ${Date.now()}`
    await page.getByTestId('team-form-name').fill(created)
    await page.getByTestId('team-form-role_en').fill('Created EN')
    await page.getByTestId('team-form-role_pt').fill('Criado PT')
    await page.getByTestId('team-form-role_es').fill('Creado ES')
    await page.getByTestId('team-form-bio_en').fill('EN bio created')
    await page.getByTestId('team-form-bio_pt').fill('PT bio criado')
    await page.getByTestId('team-form-bio_es').fill('ES bio creado')
    await page.getByTestId('team-form-experience_en').fill('20+ years')
    await page.getByTestId('team-form-experience_pt').fill('20+ anos')
    await page.getByTestId('team-form-experience_es').fill('20+ años')
    await page.getByTestId('team-form-linkedin').fill('https://www.linkedin.com/in/e2e-created')
    await page.getByTestId('team-form-photo_url').fill('https://example.com/e2e-created.jpg')
    await page.getByTestId('team-form-submit').click()

    await expect(page.getByTestId('admin-team-table')).toContainText(created)

    // Edit the new row
    const createdRow = page.locator('tr', { hasText: created })
    await createdRow.getByRole('button', { name: /edit/i }).click()
    const updated = `${created} Updated`
    const nameInput = page.getByTestId('team-form-name')
    await nameInput.fill('')
    await nameInput.fill(updated)
    await page.getByTestId('team-form-submit').click()
    await expect(page.getByTestId('admin-team-table')).toContainText(updated)

    // Reload and confirm persistence
    await page.reload()
    await expect(page.getByTestId('admin-team-table')).toContainText(updated)
  })

  test('public Team section renders seeded members and locale switch updates bio', async ({ page, isMobile }) => {
    await page.goto('/')
    const team = page.getByRole('region', { name: /sync sirius team specialists|especialistas/i })
    await expect(team).toBeVisible()
    await expect(team).toContainText(SEED_NAMES[0])
    await expect(team).toContainText('Lead EN')

    const switcher = await getLanguageSwitcher(page, isMobile)
    await selectLocale(switcher, 'PT-BR')
    await expect(team).toContainText('PT bio: orienta operações')
  })

  test('admin can toggle a member inactive; public Team section excludes them', async ({ page }) => {
    await login(page)
    await page.goto('/admin/team')

    const table = page.getByTestId('admin-team-table')
    await expect(table).toBeVisible()
    await expect(table).toContainText(SEED_NAMES[0])
    await expect(table).toContainText(SEED_NAMES[1])

    const targetRow = page.locator('tr', { hasText: SEED_NAMES[1] })
    const toggle = targetRow.getByRole('button', { name: new RegExp(`toggle active status for ${SEED_NAMES[1]}`, 'i') })
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    const patchResponse = page.waitForResponse((res) =>
      res.url().includes('/api/admin/team/') &&
      res.url().endsWith('/active') &&
      res.request().method() === 'PATCH'
    )
    await toggle.click()
    expect((await patchResponse).ok()).toBe(true)
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await page.goto('/')
    const team = page.getByRole('region', { name: /sync sirius team specialists|especialistas/i })
    await expect(team).toBeVisible()
    await expect(team).toContainText(SEED_NAMES[0])
    await expect(team).not.toContainText(SEED_NAMES[1])
  })

  test('admin can re-activate a previously deactivated member; public Team shows them again', async ({ page }) => {
    await login(page)
    await page.goto('/admin/team')

    const targetRow = page.locator('tr', { hasText: SEED_NAMES[1] })
    const toggle = targetRow.getByRole('button', { name: new RegExp(`toggle active status for ${SEED_NAMES[1]}`, 'i') })
    // deactivate first
    const deactivateResponse = page.waitForResponse((res) =>
      res.url().includes('/api/admin/team/') &&
      res.url().endsWith('/active') &&
      res.request().method() === 'PATCH'
    )
    await toggle.click()
    expect((await deactivateResponse).ok()).toBe(true)
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    // re-activate
    const activateResponse = page.waitForResponse((res) =>
      res.url().includes('/api/admin/team/') &&
      res.url().endsWith('/active') &&
      res.request().method() === 'PATCH'
    )
    await toggle.click()
    expect((await activateResponse).ok()).toBe(true)
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')

    await page.goto('/')
    const team = page.getByRole('region', { name: /sync sirius team specialists|especialistas/i })
    await expect(team).toBeVisible()
    await expect(team).toContainText(SEED_NAMES[0])
    await expect(team).toContainText(SEED_NAMES[1])
  })
})
