import type { Locale } from '@/store/useLocaleStore'

export const DEFAULT_SITE_URL = 'https://syncsirius.com'
export const SEO_LOCALES = ['en', 'pt-BR', 'es'] as const satisfies readonly Locale[]
export const OG_IMAGE_PATH = '/og-default.png'

const OG_LOCALE_BY_LOCALE: Record<Locale, string> = {
  en: 'en_US',
  'pt-BR': 'pt_BR',
  es: 'es_ES',
}

let warnedAboutSiteUrlFallback = false

function normalizeOrigin(origin: string) {
  return origin.replace(/\/+$/, '')
}

function resolveSiteUrl() {
  const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.trim()

  if (configuredSiteUrl) {
    return normalizeOrigin(configuredSiteUrl)
  }

  if (import.meta.env.DEV && !warnedAboutSiteUrlFallback) {
    console.warn('VITE_SITE_URL is not set; falling back to https://syncsirius.com for SEO URLs.')
    warnedAboutSiteUrlFallback = true
  }

  return DEFAULT_SITE_URL
}

export const SITE_URL = resolveSiteUrl()

export function isSupportedLocale(locale: string | undefined | null): locale is Locale {
  return SEO_LOCALES.includes(locale as Locale)
}

export function getOgLocale(locale: Locale) {
  return OG_LOCALE_BY_LOCALE[locale]
}

function normalizePath(path: string) {
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`

  if (withLeadingSlash === '/') {
    return '/'
  }

  return withLeadingSlash.replace(/\/+$/, '')
}

export function getCanonicalUrl(path: string, lng?: Locale) {
  const url = new URL(normalizePath(path), `${SITE_URL}/`)

  if (lng) {
    url.searchParams.set('lng', lng)
  }

  return url.toString()
}

export function getOgImageUrl() {
  return getCanonicalUrl(OG_IMAGE_PATH)
}
