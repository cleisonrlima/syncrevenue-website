import { test, expect } from '@playwright/test'

/**
 * P0-1 — Smoke: `/` and `/privacy` mount without console errors.
 * Test Design Epic 1.
 */

test.describe('Smoke @P0', () => {
  for (const path of ['/', '/privacy']) {
    test(`${path} renders without console errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', err => errors.push(`pageerror: ${err.message}`))
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
      })

      const response = await page.goto(path, { waitUntil: 'networkidle' })
      expect(response?.ok()).toBe(true)
      await expect(page.locator('main#main-content')).toBeVisible()
      expect(errors, errors.join('\n')).toHaveLength(0)
    })
  }
})
