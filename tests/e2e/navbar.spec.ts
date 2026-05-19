import { test, expect } from '@playwright/test'

test.describe('@story-6.2 navbar', () => {
  test('desktop navbar starts transparent and fills after scrolling', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith('mobile-'), 'desktop nav behavior')

    await page.goto('/', { waitUntil: 'networkidle' })

    const nav = page.getByRole('navigation', { name: /main navigation/i })
    await expect(nav).toHaveAttribute('data-overlay', 'true')
    await expect(nav).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')

    await page.evaluate(() => window.scrollTo(0, 900))
    await expect(nav).toHaveAttribute('data-overlay', 'false')
    await expect(nav).toHaveCSS('backdrop-filter', /blur/)
  })

  test('logo exposes fixed dimensions and top-anchor href', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const logo = page.getByAltText('SyncSirius')
    await expect(logo).toHaveAttribute('width', '32')
    await expect(logo).toHaveAttribute('height', '32')
    await expect(logo).toHaveAttribute('loading', 'eager')
    await expect(logo.locator('xpath=ancestor::a[1]')).toHaveAttribute('href', '#')
  })

  test('desktop section links route back to landing sections from sub-routes', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith('mobile-'), 'desktop nav behavior')

    await page.goto('/privacy', { waitUntil: 'networkidle' })

    const nav = page.getByRole('navigation', { name: /main navigation/i })
    await expect(nav.getByRole('link', { name: /^Product$/i })).toHaveAttribute('href', '/#produto')
    await expect(nav.getByRole('link', { name: /^Contact$/i })).toHaveAttribute('href', '/#contato')
  })

  test('mobile overlay exposes landing-routed section links and demo CTA', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile-'), 'mobile overlay behavior')

    await page.goto('/privacy', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /open menu/i }).click()

    const overlay = page.getByRole('navigation', { name: /mobile navigation/i })
    await expect(overlay.getByRole('link', { name: /^Product$/i })).toHaveAttribute('href', '/#produto')
    await expect(overlay.getByRole('link', { name: /^Schedule a Demo$/i })).toHaveAttribute(
      'href',
      '/#agendar-demo',
    )
  })
})
