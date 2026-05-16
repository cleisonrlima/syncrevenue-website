import { I18nextProvider } from 'react-i18next'
import { render, waitFor } from '@testing-library/react'
import i18next, { type i18n as I18nInstance } from 'i18next'
import { afterEach, describe, expect, it } from 'vitest'
import { initReactI18next } from 'react-i18next'
import { useDocumentMeta } from './SEO'
import en from '@/i18n/locales/en/translation.json'
import ptBR from '@/i18n/locales/pt-BR/translation.json'
import es from '@/i18n/locales/es/translation.json'

function HeadStub() {
  useDocumentMeta({
    titleKey: 'seo.home.title',
    descriptionKey: 'seo.home.description',
    ogTitleKey: 'seo.home.ogTitle',
    ogDescriptionKey: 'seo.home.ogDescription',
    path: '/',
  })

  return null
}

async function createI18n(language = 'en') {
  const instance = i18next.createInstance()
  await instance.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      'pt-BR': { translation: ptBR },
      es: { translation: es },
    },
    lng: language,
    fallbackLng: 'en',
    supportedLngs: ['en', 'pt-BR', 'es'],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })
  return instance
}

function getManagedTags() {
  return Array.from(document.head.querySelectorAll('[data-seo="managed"]'))
}

function metaByName(name: string) {
  return document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
}

function metaByProperty(property: string) {
  return document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
}

function canonicalLink() {
  return document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
}

function alternateLinks() {
  return Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]'))
}

function renderSEO(instance: I18nInstance) {
  return render(
    <I18nextProvider i18n={instance}>
      <HeadStub />
    </I18nextProvider>
  )
}

describe('useDocumentMeta', () => {
  afterEach(() => {
    document.title = ''
    getManagedTags().forEach(tag => tag.remove())
  })

  it('writes title, meta, OG, canonical, and hreflang tags for the active locale', async () => {
    const instance = await createI18n('en')
    renderSEO(instance)

    await waitFor(() => expect(document.title).toBe('SyncRevenue Commission Recovery | Sync Sirius'))

    expect(metaByName('description')).toHaveAttribute(
      'content',
      'Recover travel agency commission revenue lost to GDS discrepancies, debit memo disputes, and BSP/ARC reconciliation gaps.'
    )
    expect(metaByProperty('og:title')).toHaveAttribute('content', 'SyncRevenue Commission Recovery | Sync Sirius')
    expect(metaByProperty('og:description')).toHaveAttribute(
      'content',
      'Recover travel agency commission revenue lost to GDS discrepancies, debit memo disputes, and BSP/ARC reconciliation gaps.'
    )
    expect(metaByProperty('og:image')).toHaveAttribute('content', 'https://syncsirius.com/og-default.png')
    expect(metaByProperty('og:url')).toHaveAttribute('content', 'https://syncsirius.com/')
    expect(metaByProperty('og:type')).toHaveAttribute('content', 'website')
    expect(metaByProperty('og:locale')).toHaveAttribute('content', 'en_US')
    expect(canonicalLink()).toHaveAttribute('href', 'https://syncsirius.com/')

    const alternates = alternateLinks()
    expect(alternates.map(link => link.getAttribute('hreflang')).sort()).toEqual(['en', 'es', 'pt-BR', 'x-default'])
    expect(alternates.find(link => link.hreflang === 'pt-BR')).toHaveAttribute(
      'href',
      'https://syncsirius.com/?lng=pt-BR'
    )
    expect(alternates.find(link => link.hreflang === 'x-default')).toHaveAttribute('href', 'https://syncsirius.com/')
  })

  it('updates locale-sensitive tags without duplicating managed tags', async () => {
    const instance = await createI18n('en')
    renderSEO(instance)

    await waitFor(() => expect(metaByProperty('og:locale')).toHaveAttribute('content', 'en_US'))
    const initialManagedCount = getManagedTags().length

    await instance.changeLanguage('pt-BR')

    await waitFor(() => {
      expect(document.title).toBe('Recuperação de Comissões | SyncRevenue')
      expect(metaByProperty('og:locale')).toHaveAttribute('content', 'pt_BR')
    })

    expect(metaByName('description')).toHaveAttribute(
      'content',
      'Recupere comissões perdidas por divergências GDS, débitos e falhas de conciliação BSP/ARC.'
    )
    expect(metaByProperty('og:url')).toHaveAttribute('content', 'https://syncsirius.com/?lng=pt-BR')
    expect(canonicalLink()).toHaveAttribute('href', 'https://syncsirius.com/?lng=pt-BR')
    expect(getManagedTags()).toHaveLength(initialManagedCount)
  })
})
