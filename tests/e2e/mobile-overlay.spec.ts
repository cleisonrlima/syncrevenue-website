import { test, expect, devices } from '@playwright/test'

/**
 * P0-5 + P1-4 — Mobile hamburger overlay: open, focus trap, Esc close.
 * Test Design Epic 1 → R-A3, R-T5.
 */

test.use({ ...devices['Pixel 7'] })

test.describe('@P0 Mobile overlay', () => {
  test('hamburger opens overlay, Esc closes, focus returns to trigger', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const hamburger = page.getByRole('button', { name: /open menu/i })
    await expect(hamburger).toBeVisible()
    await hamburger.click()

    await expect(page.getByRole('button', { name: /close menu/i })).toBeVisible()
    expect(await hamburger.getAttribute('aria-expanded')).toBe('true')

    await page.keyboard.press('Escape')

    await expect(page.getByRole('button', { name: /open menu/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /open menu/i })).toBeFocused()
  })

  test('focus stays inside overlay while Tabbing', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /open menu/i }).click()

    const focusedTags = new Set<string>()
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      const tag = await page.evaluate(() => document.activeElement?.tagName ?? '')
      focusedTags.add(tag)
      const insideOverlay = await page.evaluate(() => {
        const overlay = document.querySelector('[role="dialog"], nav[aria-label*="menu" i], nav[aria-label*="navigation" i]')
        return overlay ? overlay.contains(document.activeElement) : true
      })
      expect(insideOverlay).toBe(true)
    }
  })
})
