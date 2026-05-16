import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_SITE_URL,
  getCanonicalUrl,
  getOgLocale,
  isSupportedLocale,
  SEO_LOCALES,
  SITE_URL,
} from './seo'

describe('seo helpers', () => {
  it('exposes the expected public canonical origin fallback', () => {
    expect(DEFAULT_SITE_URL).toBe('https://syncsirius.com')
    expect(SITE_URL).toMatch(/^https:\/\/syncsirius\.com$/)
  })

  it('builds canonical URLs without adding a trailing slash to root', () => {
    expect(getCanonicalUrl('/')).toBe('https://syncsirius.com/')
    expect(getCanonicalUrl('/privacy')).toBe('https://syncsirius.com/privacy')
  })

  it('appends locale query params only when a locale is provided', () => {
    expect(getCanonicalUrl('/', 'pt-BR')).toBe('https://syncsirius.com/?lng=pt-BR')
    expect(getCanonicalUrl('/privacy', 'es')).toBe('https://syncsirius.com/privacy?lng=es')
  })

  it('normalizes paths before joining with the canonical origin', () => {
    expect(getCanonicalUrl('privacy', 'en')).toBe('https://syncsirius.com/privacy?lng=en')
    expect(getCanonicalUrl('/privacy/', 'en')).toBe('https://syncsirius.com/privacy?lng=en')
  })

  it('maps supported locales to og:locale tags', () => {
    expect(getOgLocale('en')).toBe('en_US')
    expect(getOgLocale('pt-BR')).toBe('pt_BR')
    expect(getOgLocale('es')).toBe('es_ES')
  })

  it('guards supported locales', () => {
    expect(SEO_LOCALES).toEqual(['en', 'pt-BR', 'es'])
    expect(isSupportedLocale('pt-BR')).toBe(true)
    expect(isSupportedLocale('fr')).toBe(false)
  })

  it('warns once in dev when VITE_SITE_URL is unavailable', async () => {
    vi.resetModules()
    vi.stubEnv('DEV', true)
    vi.stubEnv('VITE_SITE_URL', '')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    await import('./seo')
    await import('./seo')

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('VITE_SITE_URL'))

    warn.mockRestore()
    vi.unstubAllEnvs()
  })
})
