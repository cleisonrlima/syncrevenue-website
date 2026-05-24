import { test, expect } from './fixtures'

const TEST_EMAIL = process.env.ADMIN_TEST_EMAIL ?? 'admin-e2e@example.com'
const TEST_PASSWORD = process.env.ADMIN_TEST_PASSWORD ?? 'admin-e2e-password'

test.describe('Admin Auth @P1', () => {
  test.beforeAll(({ e2eDb }) => {
    e2eDb.seedAdminUser({ email: TEST_EMAIL, password: TEST_PASSWORD })
  })

  test('GET /admin redirects unauthenticated visitor to /admin/login', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await page.waitForURL(/\/admin\/login$/)
    await expect(page).toHaveURL(/\/admin\/login$/)
  })

  test('GET /admin (index) redirects to /admin/login', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForURL(/\/admin\/login$/)
  })

  test('submitting wrong credentials shows Invalid credentials error', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel(/email/i).fill('ghost@example.com')
    await page.getByLabel(/password|senha|contraseña/i).fill('wrong-password')
    await page.getByRole('button', { name: /sign in|entrar|iniciar sesión/i }).click()
    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(alert).toContainText(/invalid credentials|credenciais inválidas|credenciales inválidas/i)
    await expect(page).toHaveURL(/\/admin\/login$/)
  })

  test('happy path: login → dashboard → logout → redirect back to login', async ({ page, context }) => {
    await page.goto('/admin/login')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password|senha|contraseña/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in|entrar|iniciar sesión/i }).click()
    await page.waitForURL(/\/admin\/dashboard$/)

    const cookies = await context.cookies()
    const adminCookie = cookies.find(c => c.name === 'admin_token')
    expect(adminCookie).toBeTruthy()
    expect(adminCookie?.httpOnly).toBe(true)
    expect(adminCookie?.sameSite).toBe('Strict')

    // Reload while authenticated — bootstrap via /me should keep user on dashboard
    await page.reload()
    await expect(page).toHaveURL(/\/admin\/dashboard$/)

    await page.getByTestId('admin-nav-logout').click()
    await page.waitForURL(/\/admin\/login$/)

    // Re-visit /admin after logout → bounce to /admin/login
    await page.goto('/admin/dashboard')
    await page.waitForURL(/\/admin\/login$/)
  })
})
