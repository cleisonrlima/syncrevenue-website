import { test, expect } from '@playwright/test'

/**
 * P1-1 + P1-2 — Locale switch happy path on `/` and `/privacy` without reload.
 * Test Design Epic 1 → R-I1, R-T6.
 */

test.describe('@P1 Locale switch', () => {
  test('switching locale on / updates section copy without navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const switcher = page.getByRole('group', { name: /select language/i })
    await expect(switcher).toBeVisible()

    await switcher.getByRole('button', { name: /pt-br/i }).click()
    await expect(switcher.getByRole('button', { name: /pt-br/i })).toHaveAttribute('aria-current', 'true')

    await switcher.getByRole('button', { name: /^es$/i }).click()
    await expect(switcher.getByRole('button', { name: /^es$/i })).toHaveAttribute('aria-current', 'true')

    expect(new URL(page.url()).pathname).toBe('/')
  })

  test('switching locale on /privacy keeps pathname and scroll position', async ({ page }) => {
    await page.goto('/privacy', { waitUntil: 'networkidle' })

    await page.evaluate(() => window.scrollTo(0, 400))
    const initialScroll = await page.evaluate(() => window.scrollY)
    expect(initialScroll).toBeGreaterThan(200)

    await page.getByRole('button', { name: /pt-br/i }).first().click()

    expect(new URL(page.url()).pathname).toBe('/privacy')
    const newScroll = await page.evaluate(() => window.scrollY)
    expect(Math.abs(newScroll - initialScroll)).toBeLessThan(50)
  })
})
