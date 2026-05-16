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
  es: {
    title: 'Recuperación de Comisiones | SyncRevenue',
    description: 'Recupere comisiones perdidas por discrepancias GDS, débitos y fallos de conciliación BSP/ARC.',
    ogLocale: 'es_ES',
  },
} as const

const privacySeo = {
  en: {
    title: 'Privacy Policy | Sync Sirius',
    description:
      'Read how Sync Sirius handles website inquiries, lead data, retention, and privacy rights for Brazil and California visitors.',
  },
  'pt-BR': {
    title: 'Política de Privacidade | Sync Sirius',
    description:
      'Veja como a Sync Sirius trata contatos do site, dados de leads, retenção e direitos de privacidade.',
  },
  es: {
    title: 'Política de Privacidad | Sync Sirius',
    description:
      'Vea cómo Sync Sirius trata contactos del sitio, datos de leads, retención y derechos de privacidad.',
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

  test('home switcher cycles EN → PT-BR → ES with correct og:locale tags', async ({ page, isMobile }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await expectHomeSeo(page, 'en')

    if (isMobile) {
      await page.getByRole('button', { name: /open menu/i }).click()
    }
    const switcher = page.getByRole('group', { name: /select language/i })
    await switcher.getByRole('button', { name: /pt-br/i }).click()
    await expectHomeSeo(page, 'pt-BR')

    await switcher.getByRole('button', { name: /^es$/i }).click()
    await expectHomeSeo(page, 'es')
  })

  test('querystring locale activates PT-BR on first render and preserves the URL', async ({ page }) => {
    await page.goto('/?lng=pt-BR', { waitUntil: 'domcontentloaded' })
    await expectHomeSeo(page, 'pt-BR')
    expect(new URL(page.url()).searchParams.get('lng')).toBe('pt-BR')
  })

  test('querystring locale activates ES on first render and preserves the URL', async ({ page }) => {
    await page.goto('/?lng=es', { waitUntil: 'domcontentloaded' })
    await expectHomeSeo(page, 'es')
    expect(new URL(page.url()).searchParams.get('lng')).toBe('es')
  })

  test('privacy page is indexable and emits privacy-specific alternates', async ({ page }) => {
    await page.goto('/privacy', { waitUntil: 'networkidle' })

    await expect(page).toHaveTitle(privacySeo.en.title)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', privacySeo.en.description)
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0)
    await expect(page.locator('link[rel="alternate"][hreflang="pt-BR"]')).toHaveAttribute(
      'href',
      'https://syncsirius.com/privacy?lng=pt-BR'
    )
    await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute(
      'href',
      'https://syncsirius.com/privacy?lng=es'
    )
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      'href',
      'https://syncsirius.com/privacy'
    )
  })

  test('privacy page emits PT-BR title and description via querystring', async ({ page }) => {
    await page.goto('/privacy?lng=pt-BR', { waitUntil: 'domcontentloaded' })

    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
    await expect(page).toHaveTitle(privacySeo['pt-BR'].title)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', privacySeo['pt-BR'].description)
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'https://syncsirius.com/privacy?lng=pt-BR'
    )
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'pt_BR')
  })

  test('privacy page emits ES title and description via querystring', async ({ page }) => {
    await page.goto('/privacy?lng=es', { waitUntil: 'domcontentloaded' })

    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page).toHaveTitle(privacySeo.es.title)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', privacySeo.es.description)
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'https://syncsirius.com/privacy?lng=es'
    )
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'es_ES')
  })

  test('admin routes remove public canonical and OG tags after hydration', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'networkidle' })

    await expect(page.locator('meta[property^="og:"]')).toHaveCount(0)
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0)
  })
})
