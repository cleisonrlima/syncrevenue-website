import { describe, it, expect } from 'vitest'
import i18next from 'i18next'
import './index'

const REQUIRED_KEYS = ['nav', 'hero', 'syncrevenue', 'services', 'comparison', 'team', 'security', 'references', 'privacy', 'forms', 'errors']

describe('i18n initialization', () => {
  it('has three supported locales', () => {
    const langs = i18next.options.supportedLngs as string[]
    expect(langs).toContain('en')
    expect(langs).toContain('pt-BR')
    expect(langs).toContain('es')
  })

  it('fallback language is en', () => {
    const fallback = i18next.options.fallbackLng
    const langs = Array.isArray(fallback) ? fallback : [fallback]
    expect(langs).toContain('en')
  })

  it('all required top-level keys exist in EN translations', () => {
    const enData = i18next.getDataByLanguage('en')
    const keys = Object.keys(enData?.translation ?? {})
    REQUIRED_KEYS.forEach(key => expect(keys).toContain(key))
  })

  it('pt-BR translations have same top-level keys as EN', () => {
    const enKeys = Object.keys(i18next.getDataByLanguage('en')?.translation ?? {}).sort()
    const ptKeys = Object.keys(i18next.getDataByLanguage('pt-BR')?.translation ?? {}).sort()
    expect(ptKeys).toEqual(enKeys)
  })

  it('es translations have same top-level keys as EN', () => {
    const enKeys = Object.keys(i18next.getDataByLanguage('en')?.translation ?? {}).sort()
    const esKeys = Object.keys(i18next.getDataByLanguage('es')?.translation ?? {}).sort()
    expect(esKeys).toEqual(enKeys)
  })
})
