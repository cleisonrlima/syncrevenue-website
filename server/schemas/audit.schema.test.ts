// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { auditSchema } from './audit.schema'

const valid = {
  name: 'Marcos',
  email: 'Marcos@Example.com',
  company: 'Agencia Sirius',
  role: 'Back-office Manager',
  gds: 'Amadeus',
  locale: 'pt-BR',
}

describe('auditSchema', () => {
  it('parses valid payload and lowercases email', () => {
    const out = auditSchema.parse(valid)
    expect(out.email).toBe('marcos@example.com')
  })

  it('rejects invalid locale', () => {
    expect(auditSchema.safeParse({ ...valid, locale: 'fr' }).success).toBe(false)
  })

  it('rejects invalid gds', () => {
    expect(auditSchema.safeParse({ ...valid, gds: 'Nope' }).success).toBe(false)
  })

  it('rejects empty required fields', () => {
    expect(auditSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
    expect(auditSchema.safeParse({ ...valid, company: '' }).success).toBe(false)
    expect(auditSchema.safeParse({ ...valid, role: '' }).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(auditSchema.safeParse({ ...valid, email: 'not-email' }).success).toBe(false)
  })

  it('strips empty optional notes to undefined', () => {
    const out = auditSchema.parse({ ...valid, notes: '' })
    expect(out.notes).toBeUndefined()
  })

  it('accepts all three locales', () => {
    for (const locale of ['en', 'pt-BR', 'es'] as const) {
      expect(auditSchema.safeParse({ ...valid, locale }).success).toBe(true)
    }
  })

  it('preserves trimmed notes', () => {
    const out = auditSchema.parse({ ...valid, notes: '  hello  ' })
    expect(out.notes).toBe('hello')
  })
})
