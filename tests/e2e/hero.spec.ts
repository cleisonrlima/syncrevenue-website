import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function loadHome(page: Page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('i18nextLng', 'en')
    } catch {
      // private browsing — fall back to default locale
    }
  })
  await page.goto('/', { waitUntil: 'networkidle' })
  await expect(page.locator('#hero')).toBeVisible()
}

test.describe('Hero visual refresh @P1', () => {
  test('renders the airplane LCP image and two-line H1', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await loadHome(page)

    const bg = page.getByTestId('hero-bg')
    await expect(bg).toBeVisible()
    await expect(bg).toHaveAttribute('src', '/hero/airplane.jpg')

    const bgLoaded = await bg.evaluate(node => {
      const image = node as HTMLImageElement
      return image.complete && image.naturalWidth > 0 && image.naturalHeight > 0
    })
    expect(bgLoaded).toBe(true)

    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toContainText('More commission per ticket.')
    await expect(heading).toContainText('Less rework at the rate desk.')
    await expect(heading.locator('br')).toHaveCount(1)
  })

  test('shows product panel and bundled integration wordmarks above the fold', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await loadHome(page)

    const panel = page.getByTestId('hero-product-panel')
    await expect(panel).toBeVisible()

    const panelBox = await panel.boundingBox()
    expect(panelBox).not.toBeNull()
    expect(panelBox!.y).toBeLessThan(800)

    const logos = [
      { testId: 'hero-int-amadeus', alt: 'Amadeus', file: 'amadeus.png' },
      { testId: 'hero-int-sabre', alt: 'Sabre', file: 'sabre.svg' },
      { testId: 'hero-int-travelport', alt: 'Travelport', file: 'travelport.svg' },
    ]

    for (const logo of logos) {
      const img = page.getByTestId(logo.testId).getByRole('img', { name: logo.alt })
      await expect(img).toBeVisible()
      await expect(img).toHaveAttribute('src', `/integrations/${logo.file}`)
      const loaded = await img.evaluate(node => {
        const image = node as HTMLImageElement
        return image.complete && image.naturalWidth > 0 && image.naturalHeight > 0
      })
      expect(loaded).toBe(true)
    }
  })

  test('keeps hero content within mobile viewport width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await loadHome(page)

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(overflow).toBe(false)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByTestId('hero-product-panel')).toBeVisible()
  })

  test('has no serious or critical axe violations in the hero', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await loadHome(page)

    const results = await new AxeBuilder({ page })
      .include('#hero')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['color-contrast'])
      .analyze()

    const blockingViolations = results.violations.filter(v =>
      v.impact === 'critical' || v.impact === 'serious'
    )

    expect(
      blockingViolations,
      blockingViolations.map(v => `${v.id} (${v.impact}): ${v.description}`).join('\n')
    ).toEqual([])
  })
})
