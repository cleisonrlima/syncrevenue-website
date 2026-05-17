import { test, expect } from '@playwright/test'
import db from '../../server/db'
import { seedAdminUser } from '../../server/db.seed'
import { teamDao } from '../../server/dao/team.dao'

const TEST_EMAIL = process.env.ADMIN_TEST_EMAIL ?? 'admin-team-e2e@example.com'
const TEST_PASSWORD = process.env.ADMIN_TEST_PASSWORD ?? 'admin-team-e2e-password'

const SEED_NAMES = ['Team E2E Alpha', 'Team E2E Beta']

function purgeSeedTeam() {
  const stmt = db.prepare('DELETE FROM team_members WHERE name = ?')
  for (const name of SEED_NAMES) {
    stmt.run(name)
  }
  // also wipe any rows the admin CRUD test creates so reruns stay clean
  db.prepare("DELETE FROM team_members WHERE name LIKE 'E2E Created %'").run()
}

function insertSeedTeam() {
  teamDao.create({
    name: SEED_NAMES[0],
    role_en: 'Lead EN',
    role_pt: 'Líder PT',
    role_es: 'Líder ES',
    bio_en: 'EN bio',
    bio_pt: 'PT bio: orienta operações',
    bio_es: 'ES bio',
    photo_url: null,
    linkedin: null,
    order_index: 0,
    active: 1,
  })
  teamDao.create({
    name: SEED_NAMES[1],
    role_en: 'Automation EN',
    role_pt: 'Automação PT',
    role_es: 'Automatización ES',
    bio_en: 'EN bio 2',
    bio_pt: 'PT bio 2',
    bio_es: 'ES bio 2',
    photo_url: null,
    linkedin: null,
    order_index: 1,
    active: 1,
  })
}

test.describe('Admin Team @P1', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(() => {
    seedAdminUser({ email: TEST_EMAIL, password: TEST_PASSWORD })
  })

  test.beforeEach(() => {
    purgeSeedTeam()
    insertSeedTeam()
  })

  test.afterAll(() => {
    purgeSeedTeam()
    db.close()
  })

  async function login(page: import('@playwright/test').Page) {
    await page.goto('/admin/login')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password|senha|contraseña/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in|entrar|iniciar sesión/i }).click()
    await page.waitForURL(/\/admin\/dashboard$/)
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

  test('public Team section renders seeded members and locale switch updates bio', async ({ page }) => {
    await page.goto('/')
    const team = page.getByRole('region', { name: /sync sirius team specialists|especialistas/i })
    await expect(team).toBeVisible()
    await expect(team).toContainText(SEED_NAMES[0])
    await expect(team).toContainText('Lead EN')

    // switch locale to pt-BR via the existing language switcher (PT-BR button)
    await page.getByRole('button', { name: 'PT-BR' }).first().click()
    await expect(team).toContainText('PT bio: orienta operações')
  })
})
