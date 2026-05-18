import { test, expect } from '@playwright/test'

/**
 * Story 3.2 — animations & micro-interactions.
 * AC2: reduced-motion renders final state, no transform/opacity hiding.
 * AC3: GradientButton hover does not change layout (size/position stable within 1px).
 */

test.describe('@story-3.2 animations', () => {
  test('reduced-motion renders below-the-fold section at final state', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/', { waitUntil: 'networkidle' })

    const team = page.locator('#equipe')
    await team.scrollIntoViewIfNeeded()
    await expect(team).toBeVisible()

    const styles = await team.evaluate(el => {
      const cs = getComputedStyle(el)
      return { opacity: cs.opacity, transform: cs.transform }
    })

    expect(Number(styles.opacity)).toBeGreaterThanOrEqual(0.99)
    expect(styles.transform === 'none' || styles.transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true)

    await context.close()
  })

  test('primary CTA hover keeps bounding box stable within 1px', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith('mobile-'), 'Hover behavior is desktop-only.')

    await page.goto('/', { waitUntil: 'networkidle' })

    const demoSection = page.locator('#demo-scheduler')
    await demoSection.scrollIntoViewIfNeeded()
    const cta = demoSection.getByRole('button').first()
    await expect(cta).toBeVisible()

    const before = await cta.boundingBox()
    expect(before).not.toBeNull()

    await cta.hover()
    await expect(cta).toHaveCSS('filter', /brightness/)
    const after = await cta.boundingBox()
    expect(after).not.toBeNull()

    if (!before || !after) throw new Error('bounding box missing')
    expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1)
    expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(1)
    expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1)
  })
})
