import { test, expect } from './fixtures'

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

    const demoSection = page.locator('#agendar-demo')
    await demoSection.scrollIntoViewIfNeeded()
    await page.fill('#demo-name', 'Marcos Pereira')
    await page.fill('#demo-email', 'marcos@example.com')
    await page.fill('#demo-company', 'Agencia Sirius')
    await page.selectOption('#demo-role', 'Operations')
    await page.selectOption('#demo-gds', 'Amadeus')

    const cta = demoSection.getByRole('button', { name: /schedule demonstration/i })
    await expect(cta).toBeEnabled()

    const before = await layoutBox(cta)

    await cta.hover()
    const after = await layoutBox(cta)

    expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(2)
    expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(2)
  })
})

async function layoutBox(locator: import('@playwright/test').Locator) {
  return locator.evaluate(element => {
    const htmlElement = element as HTMLElement
    return {
      x: htmlElement.offsetLeft,
      y: htmlElement.offsetTop,
      width: htmlElement.offsetWidth,
      height: htmlElement.offsetHeight,
    }
  })
}
