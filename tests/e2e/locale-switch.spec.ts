import { test, expect } from './fixtures'

/**
 * P1-1 + P1-2 — Locale switch happy path on `/` and `/privacy` without reload.
 * Test Design Epic 1 → R-I1, R-T6.
 */

async function getLanguageSwitcher(page: import('@playwright/test').Page, isMobile: boolean) {
  if (isMobile) {
    await page.getByRole('button', { name: /open menu/i }).click()
  }

  const switcher = isMobile
    ? page.getByRole('dialog', { name: /mobile navigation menu/i }).getByRole('group', { name: /select language/i })
    : page.getByLabel(/main navigation/i).getByRole('group', { name: /select language/i })
  await expect(switcher).toBeVisible()
  return switcher
}

async function selectLocale(
  switcher: import('@playwright/test').Locator,
  label: 'EN' | 'PT-BR' | 'ES'
) {
  await switcher.getByRole('button').click()
  await switcher.getByRole('menuitemradio', { name: label }).click()
  await expect(switcher.getByRole('button', { name: label })).toBeVisible()
}

test.describe('@P1 Locale switch', () => {
  test('switching locale on / updates section copy without navigation', async ({ page, isMobile }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const switcher = await getLanguageSwitcher(page, isMobile)

    await selectLocale(switcher, 'PT-BR')
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
    await expect(page).toHaveTitle('Recuperação de Comissões | SyncRevenue')

    await selectLocale(switcher, 'ES')
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page).toHaveTitle('Recuperación de Comisiones | SyncRevenue')

    expect(new URL(page.url()).pathname).toBe('/')
  })

  test('switching locale on / preserves scroll position to below-the-fold section', async ({ page, isMobile }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const team = page.locator('#equipe')
    await team.scrollIntoViewIfNeeded()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200)
    const initialScroll = await page.evaluate(() => window.scrollY)
    expect(initialScroll).toBeGreaterThan(200)

    const switcher = await getLanguageSwitcher(page, isMobile)
    await selectLocale(switcher, 'PT-BR')

    expect(new URL(page.url()).pathname).toBe('/')
    const newScroll = await page.evaluate(() => window.scrollY)
    const maxScrollDelta = isMobile ? 500 : 350
    expect(newScroll).toBeGreaterThan(200)
    expect(Math.abs(newScroll - initialScroll)).toBeLessThan(maxScrollDelta)
  })

  test('switching locale on /privacy keeps pathname and scroll position', async ({ page, isMobile }) => {
    await page.goto('/privacy', { waitUntil: 'networkidle' })

    const switcher = await getLanguageSwitcher(page, isMobile)
    await selectLocale(switcher, 'PT-BR')

    expect(new URL(page.url()).pathname).toBe('/privacy')
  })
})
