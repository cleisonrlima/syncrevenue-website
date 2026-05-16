import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Sitemap <loc> convention (Story 3.11, approach A):
//   Each <url><loc> stays as the no-lng URL (e.g. https://syncsirius.com/) and doubles as the
//   `x-default` signal. The per-locale variants are still exposed via the xhtml:link
//   `<alternate hreflang="<locale>">` entries inside the same <url> block.
//   The runtime <link rel="canonical"> emitted by src/components/SEO.tsx self-references the
//   active locale (including ?lng=en for EN), matching its hreflang alternate exactly.
//   Approach (B) — moving <loc> to ?lng=<locale> for every variant and dropping the no-lng
//   x-default — was rejected to keep the sitemap matrix terse and avoid duplicate <loc> rows
//   per route.

export const DEFAULT_SITE_URL = 'https://syncsirius.com'
export const SEO_LOCALES = ['en', 'pt-BR', 'es']
export const ROUTES = ['/', '/privacy']

export function resolveSiteUrl(env = process.env) {
  return (env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '')
}

export function canonicalUrl(route, locale, siteUrl = resolveSiteUrl()) {
  const url = new URL(route, `${siteUrl}/`)
  if (locale) {
    url.searchParams.set('lng', locale)
  }
  return url.toString()
}

export function xmlEscape(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function renderSitemap({ siteUrl = resolveSiteUrl(), lastmod = new Date().toISOString().slice(0, 10) } = {}) {
  const urls = ROUTES
    .map(route => {
      const alternates = [
        ...SEO_LOCALES.map(
          locale =>
            `    <xhtml:link rel="alternate" hreflang="${locale}" href="${xmlEscape(canonicalUrl(route, locale, siteUrl))}" />`
        ),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(canonicalUrl(route, undefined, siteUrl))}" />`,
      ].join('\n')

      return `  <url>
    <loc>${xmlEscape(canonicalUrl(route, undefined, siteUrl))}</loc>
    <lastmod>${lastmod}</lastmod>
${alternates}
  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`
}

export function renderRobots({ siteUrl = resolveSiteUrl() } = {}) {
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Sitemap: ${siteUrl}/sitemap.xml
`
}

export async function writeSeoAssets({
  outDir,
  siteUrl = resolveSiteUrl(),
  lastmod = new Date().toISOString().slice(0, 10),
} = {}) {
  const resolvedOutDir =
    outDir ?? path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'dist', 'client')
  await mkdir(resolvedOutDir, { recursive: true })
  await writeFile(path.join(resolvedOutDir, 'sitemap.xml'), renderSitemap({ siteUrl, lastmod }), 'utf8')
  await writeFile(path.join(resolvedOutDir, 'robots.txt'), renderRobots({ siteUrl }), 'utf8')
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (invokedDirectly) {
  await writeSeoAssets()
}
