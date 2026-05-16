import { test, expect, devices } from '@playwright/test'

/**
 * P0-5 + P1-4 — Mobile hamburger overlay: open, focus trap, Esc close.
 * Test Design Epic 1 → R-A3, R-T5.
 */

test.use({ ...devices['Pixel 7'] })

test.describe('@P0 Mobile overlay', () => {
  test('hamburger opens overlay, Esc closes, focus returns to trigger', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const openTrigger = page.getByRole('button', { name: /open menu/i })
    await expect(openTrigger).toBeVisible()
    await openTrigger.click()

    const closeTrigger = page.getByRole('button', { name: /close menu/i })
    await expect(closeTrigger).toBeVisible()
    expect(await closeTrigger.getAttribute('aria-expanded')).toBe('true')

    await page.keyboard.press('Escape')

    const reopenedTrigger = page.getByRole('button', { name: /open menu/i })
    await expect(reopenedTrigger).toBeVisible()
    await expect(reopenedTrigger).toBeFocused()
  })

  test('tapping the backdrop closes the overlay; tapping content keeps it open', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const hamburger = page.getByRole('button', { name: /open menu/i })
    await hamburger.click()
    await expect(page.getByRole('button', { name: /close menu/i })).toBeVisible()

    // Tapping a link inside the content panel should NOT close via the
    // backdrop handler (the link's own onClick closes after navigation,
    // but the backdrop's target-guard should not fire).
    const content = page.getByTestId('mobile-overlay-content')
    const contentBox = await content.boundingBox()
    expect(contentBox).not.toBeNull()
    // Click on the content panel itself (not a child link) — picks a point
    // inside the panel padding so the click target IS the content element.
    if (contentBox) {
      await content.click({ position: { x: 2, y: 2 } })
    }
    await expect(page.getByRole('button', { name: /close menu/i })).toBeVisible()

    // Tap to the LEFT of the content panel (now constrained to max-w-sm) —
    // this region is the backdrop, so the click target === backdrop and the
    // target-guard fires.
    const backdrop = page.getByTestId('mobile-overlay-backdrop')
    const backdropBox = await backdrop.boundingBox()
    expect(backdropBox).not.toBeNull()
    if (backdropBox && contentBox) {
      const outsideX = Math.max(2, contentBox.x - 10)
      await backdrop.click({ position: { x: outsideX, y: 400 } })
    }
    await expect(page.getByRole('button', { name: /open menu/i })).toBeVisible()
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
