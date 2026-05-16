import { expect, test } from '@playwright/test'

const seo = {
  en: {
    title: 'SyncRevenue Commission Recovery | Sync Sirius',
    description:
      'Recover travel agency commission revenue lost to GDS discrepancies, debit memo disputes, and BSP/ARC reconciliation gaps.',
    ogLocale: 'en_US',
  },
  'pt-BR': {
    title: 'Recuperação de Comissões | SyncRevenue',
    description: 'Recupere comissões perdidas por divergências GDS, débitos e falhas de conciliação BSP/ARC.',
    ogLocale: 'pt_BR',
  },
} as const

async function expectHomeSeo(page: import('@playwright/test').Page, locale: keyof typeof seo) {
  await expect(page.locator('html')).toHaveAttribute('lang', locale)
  await expect(page).toHaveTitle(seo[locale].title)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', seo[locale].description)
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', seo[locale].title)
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', seo[locale].description)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://syncsirius.com/og-default.png'
  )
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    locale === 'en' ? 'https://syncsirius.com/' : `https://syncsirius.com/?lng=${locale}`
  )
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website')
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', seo[locale].ogLocale)

  const alternates = page.locator('link[rel="alternate"][hreflang]')
  await expect(alternates).toHaveCount(4)
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    'href',
    'https://syncsirius.com/?lng=en'
  )
  await expect(page.locator('link[rel="alternate"][hreflang="pt-BR"]')).toHaveAttribute(
    'href',
    'https://syncsirius.com/?lng=pt-BR'
  )
  await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute(
    'href',
    'https://syncsirius.com/?lng=es'
  )
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
    'href',
    'https://syncsirius.com/'
  )
}

test.describe('@P1 SEO metadata', () => {
  test('home emits locale-aware head tags in EN and PT-BR', async ({ page, isMobile }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await expectHomeSeo(page, 'en')

    if (isMobile) {
      await page.getByRole('button', { name: /open menu/i }).click()
    }
    await page.getByRole('group', { name: /select language/i }).getByRole('button', { name: /pt-br/i }).click()
    await expectHomeSeo(page, 'pt-BR')
  })

  test('querystring locale activates PT-BR on first render and preserves the URL', async ({ page }) => {
    await page.goto('/?lng=pt-BR', { waitUntil: 'domcontentloaded' })
    await expectHomeSeo(page, 'pt-BR')
    expect(new URL(page.url()).searchParams.get('lng')).toBe('pt-BR')
  })

  test('privacy page is indexable and emits privacy-specific alternates', async ({ page }) => {
    await page.goto('/privacy', { waitUntil: 'networkidle' })

    await expect(page).toHaveTitle('Privacy Policy | Sync Sirius')
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0)
    await expect(page.locator('link[rel="alternate"][hreflang="pt-BR"]')).toHaveAttribute(
      'href',
      'https://syncsirius.com/privacy?lng=pt-BR'
    )
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      'href',
      'https://syncsirius.com/privacy'
    )
  })

  test('admin routes remove public canonical and OG tags after hydration', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'networkidle' })

    await expect(page.locator('meta[property^="og:"]')).toHaveCount(0)
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0)
  })
})
