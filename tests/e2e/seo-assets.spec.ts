import { expect, test } from '@playwright/test'

/**
 * Build asset SEO coverage.
 * Run with:
 *   npm run build
 *   npm run preview -- --host 127.0.0.1
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npx playwright test tests/e2e/seo-assets.spec.ts
 */

test.describe('@P1 SEO static assets', () => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'Run this spec against npm run preview so dist/client assets are exercised.')

  test('serves sitemap.xml with route and hreflang entries only for public pages', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toMatch(/application\/xml|text\/xml/)

    const body = await response.text()
    expect(body).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
    expect(body).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
    expect(body.match(/<url>/g)).toHaveLength(2)
    expect(body).toContain('<loc>https://syncsirius.com/</loc>')
    expect(body).toContain('<loc>https://syncsirius.com/privacy</loc>')
    expect(body).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)
    expect(body).toContain('hreflang="en" href="https://syncsirius.com/?lng=en"')
    expect(body).toContain('hreflang="pt-BR" href="https://syncsirius.com/?lng=pt-BR"')
    expect(body).toContain('hreflang="es" href="https://syncsirius.com/?lng=es"')
    expect(body).toContain('hreflang="x-default" href="https://syncsirius.com/"')
    expect(body).not.toContain('/admin')
  })

  test('serves robots.txt with public allowlist, admin/API disallows, and sitemap directive', async ({ request }) => {
    const response = await request.get('/robots.txt')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toMatch(/text\/plain/)

    const body = await response.text()
    expect(body).toContain('User-agent: *')
    expect(body).toContain('Allow: /')
    expect(body).toContain('Disallow: /admin')
    expect(body).toContain('Disallow: /api')
    expect(body).toContain('Sitemap: https://syncsirius.com/sitemap.xml')
  })
})
