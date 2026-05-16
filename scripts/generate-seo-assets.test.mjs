import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SITE_URL,
  ROUTES,
  SEO_LOCALES,
  canonicalUrl,
  renderRobots,
  renderSitemap,
  resolveSiteUrl,
} from './generate-seo-assets.mjs'

describe('generate-seo-assets', () => {
  it('falls back to the default canonical origin when VITE_SITE_URL is unset', () => {
    expect(resolveSiteUrl({})).toBe(DEFAULT_SITE_URL)
    expect(resolveSiteUrl({ VITE_SITE_URL: 'https://example.com/' })).toBe('https://example.com')
  })

  it('builds canonical URLs without trailing slash on root and with optional locale query', () => {
    expect(canonicalUrl('/')).toBe('https://syncsirius.com/')
    expect(canonicalUrl('/privacy')).toBe('https://syncsirius.com/privacy')
    expect(canonicalUrl('/privacy', 'pt-BR')).toBe('https://syncsirius.com/privacy?lng=pt-BR')
  })

  it('renders sitemap.xml with required schema, two routes, lastmod, and full hreflang matrix', () => {
    const sitemap = renderSitemap({ lastmod: '2026-05-15' })

    expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
    expect(sitemap).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')

    const urlMatches = sitemap.match(/<url>/g) ?? []
    expect(urlMatches).toHaveLength(ROUTES.length)
    expect(urlMatches).toHaveLength(2)

    expect(sitemap).toContain('<loc>https://syncsirius.com/</loc>')
    expect(sitemap).toContain('<loc>https://syncsirius.com/privacy</loc>')

    const lastmodMatches = sitemap.match(/<lastmod>2026-05-15<\/lastmod>/g) ?? []
    expect(lastmodMatches).toHaveLength(2)

    for (const route of ROUTES) {
      for (const locale of SEO_LOCALES) {
        expect(sitemap).toContain(
          `hreflang="${locale}" href="${canonicalUrl(route, locale)}"`
        )
      }
      expect(sitemap).toContain(`hreflang="x-default" href="${canonicalUrl(route)}"`)
    }

    const alternateLinks = sitemap.match(/<xhtml:link\b/g) ?? []
    expect(alternateLinks).toHaveLength(ROUTES.length * (SEO_LOCALES.length + 1))

    expect(sitemap).not.toMatch(/\/admin/)
  })

  it('renders sitemap with a supplied site URL override', () => {
    const sitemap = renderSitemap({ siteUrl: 'https://stage.example.com', lastmod: '2026-05-15' })
    expect(sitemap).toContain('<loc>https://stage.example.com/</loc>')
    expect(sitemap).toContain('hreflang="es" href="https://stage.example.com/privacy?lng=es"')
  })

  it('renders robots.txt with public allowlist, admin/API disallows, and absolute sitemap directive', () => {
    const robots = renderRobots()
    expect(robots).toContain('User-agent: *')
    expect(robots).toContain('Allow: /')
    expect(robots).toContain('Disallow: /admin')
    expect(robots).toContain('Disallow: /api')
    expect(robots).toContain('Sitemap: https://syncsirius.com/sitemap.xml')
    expect(robots).not.toContain('User-agent: Googlebot')
  })

  it('renders robots.txt with overridden site URL for build-time canonical', () => {
    const robots = renderRobots({ siteUrl: 'https://stage.example.com' })
    expect(robots).toContain('Sitemap: https://stage.example.com/sitemap.xml')
  })
})
