import { describe, it, expect } from 'vitest'
import type { TFunction } from 'i18next'
import { createAdminTeamSchema, type AdminTeamFormValues } from './team-schema'

const t = ((key: string) => key) as unknown as TFunction

const valid: AdminTeamFormValues = {
  name: 'Maria',
  role_en: 'Lead',
  role_pt: 'Líder',
  role_es: 'Líder',
  bio_en: 'en',
  bio_pt: 'pt',
  bio_es: 'es',
  experience_en: '20+ years',
  experience_pt: '20+ anos',
  experience_es: '20+ años',
  linkedin: '',
  photo_url: '',
  order_index: '0',
}

describe('createAdminTeamSchema', () => {
  const schema = createAdminTeamSchema(t)

  it('accepts a minimal valid form and coerces order_index', () => {
    const result = schema.safeParse({ ...valid, order_index: '3' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.order_index).toBe(3)
      expect(result.data.linkedin).toBeNull()
      expect(result.data.photo_url).toBeNull()
    }
  })

  it.each([
    'name',
    'role_en',
    'role_pt',
    'role_es',
    'bio_en',
    'bio_pt',
    'bio_es',
    'experience_en',
    'experience_pt',
    'experience_es',
  ] as const)('rejects empty %s with required error key', (field) => {
    const result = schema.safeParse({ ...valid, [field]: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === field)
      expect(issue?.message).toBe('admin.team.form.errors.required')
    }
  })

  it('rejects invalid linkedin URL', () => {
    const result = schema.safeParse({ ...valid, linkedin: 'not a url' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'linkedin')
      expect(issue?.message).toBe('admin.team.form.errors.url')
    }
  })

  it('accepts a valid linkedin URL', () => {
    const result = schema.safeParse({
      ...valid,
      linkedin: 'https://www.linkedin.com/in/maria',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.linkedin).toBe('https://www.linkedin.com/in/maria')
    }
  })

  it('rejects negative order_index', () => {
    const result = schema.safeParse({ ...valid, order_index: '-1' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'order_index')
      expect(issue?.message).toBe('admin.team.form.errors.orderIndex')
    }
  })

  it('rejects non-integer order_index', () => {
    const result = schema.safeParse({ ...valid, order_index: '1.5' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'order_index')
      expect(issue?.message).toBe('admin.team.form.errors.orderIndex')
    }
  })

  it('rejects non-numeric order_index', () => {
    const result = schema.safeParse({ ...valid, order_index: 'abc' })
    expect(result.success).toBe(false)
  })
})
