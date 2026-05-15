// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { demoSchema } from './demo.schema'

const valid = {
  name: 'Pri',
  email: 'Pri@Example.com',
  company: 'ACME',
  role: 'CEO',
  gds: 'Amadeus',
  locale: 'en',
}

describe('demoSchema', () => {
  it('parses valid payload and lowercases email', () => {
    const out = demoSchema.parse(valid)
    expect(out.email).toBe('pri@example.com')
  })

  it('rejects invalid locale', () => {
    const r = demoSchema.safeParse({ ...valid, locale: 'fr' })
    expect(r.success).toBe(false)
  })

  it('rejects invalid gds', () => {
    const r = demoSchema.safeParse({ ...valid, gds: 'Nope' })
    expect(r.success).toBe(false)
  })

  it('rejects empty required fields', () => {
    expect(demoSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
    expect(demoSchema.safeParse({ ...valid, company: '' }).success).toBe(false)
    expect(demoSchema.safeParse({ ...valid, role: '' }).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(demoSchema.safeParse({ ...valid, email: 'not-email' }).success).toBe(false)
  })

  it('strips empty optional phone/message to undefined', () => {
    const out = demoSchema.parse({ ...valid, phone: '', message: '' })
    expect(out.phone).toBeUndefined()
    expect(out.message).toBeUndefined()
  })

  it('accepts all three locales', () => {
    for (const locale of ['en', 'pt-BR', 'es'] as const) {
      expect(demoSchema.safeParse({ ...valid, locale }).success).toBe(true)
    }
  })
})
