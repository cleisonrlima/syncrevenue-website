import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_SITE_URL = 'https://syncsirius.com'
const locales = ['en', 'pt-BR', 'es']
const routes = ['/', '/privacy']

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const clientDistDir = path.join(rootDir, 'dist', 'client')
const siteUrl = (process.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '')
const lastmod = new Date().toISOString().slice(0, 10)

function canonicalUrl(route, locale) {
  const url = new URL(route, `${siteUrl}/`)
  if (locale) {
    url.searchParams.set('lng', locale)
  }
  return url.toString()
}

function xmlEscape(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function renderSitemap() {
  const urls = routes
    .map(route => {
      const alternates = [
        ...locales.map(
          locale =>
            `    <xhtml:link rel="alternate" hreflang="${locale}" href="${xmlEscape(canonicalUrl(route, locale))}" />`
        ),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(canonicalUrl(route))}" />`,
      ].join('\n')

      return `  <url>
    <loc>${xmlEscape(canonicalUrl(route))}</loc>
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

function renderRobots() {
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Sitemap: ${siteUrl}/sitemap.xml
`
}

await mkdir(clientDistDir, { recursive: true })
await writeFile(path.join(clientDistDir, 'sitemap.xml'), renderSitemap(), 'utf8')
await writeFile(path.join(clientDistDir, 'robots.txt'), renderRobots(), 'utf8')
