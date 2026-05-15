import { describe, it, expect } from 'vitest'
import i18next from 'i18next'
import './index'

const REQUIRED_KEYS = ['nav', 'hero', 'syncrevenue', 'services', 'comparison', 'team', 'security', 'references', 'privacy', 'forms', 'errors']

type TeamTranslation = {
  members: Array<{
    name: string
    role: string
    bio: string
    photo: string
  }>
}

type SecurityTranslation = {
  commitments: Record<string, { title: string; description: string }>
  separation: { title: string; description: string }
}

type ReferenceTranslation = {
  items?: unknown
}

type PrivacyTranslation = {
  sections: Record<string, { title: string; body: string | string[] }>
}

function getTeamTranslation(locale: string) {
  return (i18next.getDataByLanguage(locale)?.translation as unknown as { team: TeamTranslation }).team
}

function getTranslation(locale: string) {
  return i18next.getDataByLanguage(locale)?.translation as
    | { security?: SecurityTranslation; references?: ReferenceTranslation; privacy?: PrivacyTranslation }
    | undefined
}

type KeyShape = 'leaf' | 'array' | { [k: string]: KeyShape }

function shapeOf(value: unknown): KeyShape {
  if (Array.isArray(value)) {
    return 'array'
  }
  if (value !== null && typeof value === 'object') {
    const result: { [k: string]: KeyShape } = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      result[key] = shapeOf((value as Record<string, unknown>)[key])
    }
    return result
  }
  return 'leaf'
}

function expectDeepKeyParity(baseLocale: string, targetLocale: string) {
  const base = i18next.getDataByLanguage(baseLocale)?.translation
  const target = i18next.getDataByLanguage(targetLocale)?.translation
  expect(base).toBeDefined()
  expect(target).toBeDefined()
  expect(shapeOf(target)).toEqual(shapeOf(base))
}

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

  it('pt-BR translations have deep key parity with EN (R-I1)', () => {
    expectDeepKeyParity('en', 'pt-BR')
  })

  it('es translations have deep key parity with EN (R-I1)', () => {
    expectDeepKeyParity('en', 'es')
  })

  it('all locales expose team.members with required public fields', () => {
    ;['en', 'pt-BR', 'es'].forEach(locale => {
      const translation = i18next.getDataByLanguage(locale)?.translation as
        | { team?: { members?: unknown } }
        | undefined
      const members = translation?.team?.members

      expect(Array.isArray(members)).toBe(true)
      expect(members).toHaveLength(2)

      ;(members as Array<Record<string, unknown>>).forEach(member => {
        expect(typeof member.name).toBe('string')
        expect(typeof member.role).toBe('string')
        expect(typeof member.bio).toBe('string')
        expect(typeof member.photo).toBe('string')
        expect(member.name).not.toBe('')
        expect(member.role).not.toBe('')
        expect(member.bio).not.toBe('')
      })
    })
  })

  it('team roles and bios are locale-specific across supported locales', () => {
    const enMembers = getTeamTranslation('en').members
    const ptMembers = getTeamTranslation('pt-BR').members
    const esMembers = getTeamTranslation('es').members

    enMembers.forEach((member: { role: string; bio: string }, index: number) => {
      expect(ptMembers[index].role).not.toBe(member.role)
      expect(ptMembers[index].bio).not.toBe(member.bio)
      expect(esMembers[index].role).not.toBe(member.role)
      expect(esMembers[index].bio).not.toBe(member.bio)
    })
  })

  it('all locales expose required security commitment keys', () => {
    ;['en', 'pt-BR', 'es'].forEach(locale => {
      const security = getTranslation(locale)?.security

      expect(typeof security?.commitments.encryption.title).toBe('string')
      expect(typeof security?.commitments.encryption.description).toBe('string')
      expect(typeof security?.commitments.certification.title).toBe('string')
      expect(typeof security?.commitments.certification.description).toBe('string')
      expect(typeof security?.commitments.insurance.title).toBe('string')
      expect(typeof security?.commitments.insurance.description).toBe('string')
      expect(typeof security?.separation.title).toBe('string')
      expect(typeof security?.separation.description).toBe('string')
      expect(security?.separation.description).toMatch(/GDS/i)
    })
  })

  it('validates reference item contract when approved production references are present', () => {
    ;['en', 'pt-BR', 'es'].forEach(locale => {
      const references = getTranslation(locale)?.references

      if (references?.items === undefined) {
        return
      }

      expect(Array.isArray(references.items)).toBe(true)
      ;(references.items as Array<Record<string, unknown>>).forEach(item => {
        expect(typeof item.agencyName).toBe('string')
        expect(typeof item.location).toBe('string')
        expect(typeof item.relationship).toBe('string')
        expect(typeof item.testimonial === 'string' || typeof item.referenceDetail === 'string').toBe(true)
        expect(item.agencyName).not.toMatch(/a leading TMC|recognized agency/i)
      })
    })
  })

  it('all locales expose the same privacy policy section contract and critical commitments', () => {
    const requiredSectionKeys = [
      'dataCollection',
      'dataUse',
      'storageAccess',
      'dataRetention',
      'cookies',
      'gdsData',
      'lgpdRights',
      'ccpaRights',
      'contact',
    ]

    ;['en', 'pt-BR', 'es'].forEach(locale => {
      const privacy = getTranslation(locale)?.privacy

      expect(privacy).toBeDefined()
      expect(Object.keys(privacy?.sections ?? {}).sort()).toEqual([...requiredSectionKeys].sort())

      requiredSectionKeys.forEach(sectionKey => {
        const section = privacy?.sections[sectionKey]
        expect(typeof section?.title).toBe('string')
        expect(section?.title).not.toBe('')
        expect(typeof section?.body === 'string' || Array.isArray(section?.body)).toBe(true)

        const bodyItems = Array.isArray(section?.body) ? section.body : [section?.body]
        bodyItems.forEach(item => {
          expect(typeof item).toBe('string')
          expect(item).not.toBe('')
        })
      })

      const policyCopy = JSON.stringify(privacy)
      expect(policyCopy).toMatch(/privacy@syncsirius\.com/i)
      expect(policyCopy).toMatch(/24\s+(months|meses)/i)
      expect(policyCopy).toMatch(/SQLite/i)
      expect(policyCopy).toMatch(/GDS/i)
      expect(policyCopy).toMatch(/LGPD/i)
      expect(policyCopy).toMatch(/CCPA/i)
      expect(policyCopy).toMatch(/cookie/i)
    })
  })
})
