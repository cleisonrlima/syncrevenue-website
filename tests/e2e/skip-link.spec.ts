import { test, expect } from './fixtures'

/**
 * P1-5 — Skip-to-main link is first tab stop, focuses <main> on activation.
 * Test Design Epic 1 → R-A1.
 */

test('@P1 skip-to-main is first tab stop and activates main focus', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })

  await page.keyboard.press('Tab')

  const focusedHref = await page.evaluate(() => {
    const el = document.activeElement as HTMLAnchorElement | null
    return el?.getAttribute('href') ?? ''
  })
  expect(focusedHref).toBe('#main-content')

  await page.keyboard.press('Enter')
  const focusedId = await page.evaluate(() => document.activeElement?.id ?? '')
  expect(focusedId).toBe('main-content')
})
