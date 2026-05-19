// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { CONTACT_SUBJECT_VALUES, contactSchema } from './contact.schema'

const valid = {
  name: 'Pri',
  email: 'pri@example.com',
  subject: 'commercial',
  message: 'Hello',
  locale: 'pt-BR',
}

describe('contactSchema', () => {
  it('parses valid payload', () => {
    expect(contactSchema.parse(valid).locale).toBe('pt-BR')
  })

  it('rejects invalid locale', () => {
    expect(contactSchema.safeParse({ ...valid, locale: 'fr' }).success).toBe(false)
  })

  it('requires all fields', () => {
    for (const k of ['name', 'subject', 'message'] as const) {
      expect(contactSchema.safeParse({ ...valid, [k]: '' }).success).toBe(false)
    }
  })

  it('rejects subjects outside the contact routing allowlist', () => {
    expect(CONTACT_SUBJECT_VALUES).toEqual([
      'commercial',
      'support',
      'partnerships',
      'press',
      'other',
    ])
    expect(contactSchema.safeParse({ ...valid, subject: 'Partnerships' }).success).toBe(false)
    expect(contactSchema.safeParse({ ...valid, subject: 'SyncRevenue' }).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(contactSchema.safeParse({ ...valid, email: 'not-email' }).success).toBe(false)
  })
})
