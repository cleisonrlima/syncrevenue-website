import { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getCanonicalUrl,
  getOgImageUrl,
  getOgLocale,
  isSupportedLocale,
  SEO_LOCALES,
} from '@/lib/seo'
import type { Locale } from '@/store/useLocaleStore'

type UseDocumentMetaOptions = {
  titleKey: string
  descriptionKey: string
  ogTitleKey: string
  ogDescriptionKey: string
  path: string
}

const MANAGED_ATTR = 'data-seo'
const MANAGED_VALUE = 'managed'

function markManaged(element: Element) {
  element.setAttribute(MANAGED_ATTR, MANAGED_VALUE)
}

function upsertMeta(selector: string, attributes: Record<string, string>) {
  const existing = document.head.querySelector<HTMLMetaElement>(selector)
  const element = existing ?? document.createElement('meta')

  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value)
  }

  markManaged(element)

  if (!existing) {
    document.head.appendChild(element)
  }
}

function upsertLink(selector: string, attributes: Record<string, string>) {
  const existing = document.head.querySelector<HTMLLinkElement>(selector)
  const element = existing ?? document.createElement('link')

  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value)
  }

  markManaged(element)

  if (!existing) {
    document.head.appendChild(element)
  }
}

function upsertTitle(title: string) {
  const existing = document.head.querySelector('title')
  const element = existing ?? document.createElement('title')
  element.textContent = title
  markManaged(element)

  if (!existing) {
    document.head.appendChild(element)
  }
}

function removeManagedTags() {
  document.head.querySelectorAll(`[${MANAGED_ATTR}="${MANAGED_VALUE}"]`).forEach(element => element.remove())
}

// Canonical / og:url convention (Story 3.11, approach A):
//   Each runtime canonical and og:url self-references its locale variant via `?lng=<locale>`
//   so it matches the corresponding `<link rel="alternate" hreflang="<locale>">` exactly,
//   including EN (`?lng=en`). The sitemap `<loc>` stays as the no-lng URL and the `x-default`
//   hreflang still points to the no-lng URL — so the sitemap doubles as the x-default signal
//   and only the runtime <head> changes per locale.
//   Static index.html head defaults are intentionally the no-lng English URL (x-default);
//   hydration overwrites them with `?lng=en` for the EN variant.

export function useDocumentMeta({
  titleKey,
  descriptionKey,
  ogTitleKey,
  ogDescriptionKey,
  path,
}: UseDocumentMetaOptions) {
  const { t, i18n } = useTranslation()
  const resolvedLanguage = i18n.resolvedLanguage

  useLayoutEffect(() => {
    const locale = isSupportedLocale(resolvedLanguage) ? resolvedLanguage : 'en'
    const title = t(titleKey)
    const description = t(descriptionKey)
    const ogTitle = t(ogTitleKey)
    const ogDescription = t(ogDescriptionKey)
    const canonicalUrl = getCanonicalUrl(path, locale)

    upsertTitle(title)
    upsertMeta('meta[name="description"]', { name: 'description', content: description })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: ogTitle })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: ogDescription })
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: getOgImageUrl() })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: getOgLocale(locale) })
    upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl })

    for (const alternateLocale of SEO_LOCALES) {
      upsertLink(`link[rel="alternate"][hreflang="${alternateLocale}"]`, {
        rel: 'alternate',
        hreflang: alternateLocale,
        href: getCanonicalUrl(path, alternateLocale),
      })
    }

    upsertLink('link[rel="alternate"][hreflang="x-default"]', {
      rel: 'alternate',
      hreflang: 'x-default',
      href: getCanonicalUrl(path),
    })

    return removeManagedTags
  }, [descriptionKey, i18n, ogDescriptionKey, ogTitleKey, path, resolvedLanguage, t, titleKey])
}
