import { describe, it, expect } from 'vitest'
import {
  adminTeamCreateSchema,
  adminTeamUpdateSchema,
  adminTeamParamsSchema,
} from './admin-team.schema'

const validBase = {
  name: 'Maria Silva',
  role_en: 'Lead',
  role_pt: 'Líder',
  role_es: 'Líder',
  bio_en: 'bio en',
  bio_pt: 'bio pt',
  bio_es: 'bio es',
  experience_en: '20+ years',
  experience_pt: '20+ anos',
  experience_es: '20+ años',
  order_index: 0,
}

describe('adminTeamCreateSchema', () => {
  it('accepts a valid minimal body and defaults order_index when missing', () => {
    const { order_index: _omit, ...withoutOrder } = validBase
    const result = adminTeamCreateSchema.safeParse(withoutOrder)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.order_index).toBe(0)
      expect(result.data.linkedin).toBeNull()
      expect(result.data.photo_url).toBeNull()
    }
  })

  it('accepts valid URLs for linkedin and photo_url', () => {
    const result = adminTeamCreateSchema.safeParse({
      ...validBase,
      linkedin: 'https://www.linkedin.com/in/maria',
      photo_url: 'https://example.com/photo.webp',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.linkedin).toBe('https://www.linkedin.com/in/maria')
      expect(result.data.photo_url).toBe('https://example.com/photo.webp')
    }
  })

  it('coerces empty string linkedin to null', () => {
    const result = adminTeamCreateSchema.safeParse({
      ...validBase,
      linkedin: '',
      photo_url: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.linkedin).toBeNull()
      expect(result.data.photo_url).toBeNull()
    }
  })

  it('rejects empty required name with field-keyed issue path', () => {
    const result = adminTeamCreateSchema.safeParse({ ...validBase, name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['name'])
    }
  })

  it.each([
    'role_en',
    'role_pt',
    'role_es',
    'bio_en',
    'bio_pt',
    'bio_es',
    'experience_en',
    'experience_pt',
    'experience_es',
  ] as const)('rejects whitespace-only %s', (field) => {
    const result = adminTeamCreateSchema.safeParse({ ...validBase, [field]: '   ' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual([field])
    }
  })

  it('rejects invalid linkedin URL with field path', () => {
    const result = adminTeamCreateSchema.safeParse({ ...validBase, linkedin: 'not a url' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['linkedin'])
    }
  })

  it('rejects invalid photo_url with field path', () => {
    const result = adminTeamCreateSchema.safeParse({ ...validBase, photo_url: 'not-a-url' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['photo_url'])
    }
  })

  it('coerces string order_index "2" to number 2', () => {
    const result = adminTeamCreateSchema.safeParse({ ...validBase, order_index: '2' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.order_index).toBe(2)
  })

  it('rejects negative order_index', () => {
    const result = adminTeamCreateSchema.safeParse({ ...validBase, order_index: -1 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['order_index'])
    }
  })

  it('rejects non-integer order_index', () => {
    const result = adminTeamCreateSchema.safeParse({ ...validBase, order_index: 1.5 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['order_index'])
    }
  })

  it('silently ignores unknown body keys including active', () => {
    const result = adminTeamCreateSchema.safeParse({
      ...validBase,
      active: 0,
      extra: 'ignored',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect('active' in result.data).toBe(false)
      expect('extra' in result.data).toBe(false)
    }
  })
})

describe('adminTeamUpdateSchema', () => {
  it('treats required fields as still required on update (full-replace semantics)', () => {
    const { bio_en: _omit, ...withoutBio } = validBase
    const result = adminTeamUpdateSchema.safeParse(withoutBio)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['bio_en'])
    }
  })

  it('silently strips active from update body', () => {
    const result = adminTeamUpdateSchema.safeParse({ ...validBase, active: 0 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect('active' in result.data).toBe(false)
    }
  })
})

describe('adminTeamParamsSchema', () => {
  it('coerces numeric string id', () => {
    const result = adminTeamParamsSchema.safeParse({ id: '7' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.id).toBe(7)
  })

  it('rejects "abc" id with issue path ["id"]', () => {
    const result = adminTeamParamsSchema.safeParse({ id: 'abc' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['id'])
    }
  })

  it('rejects "-1" id with issue path ["id"]', () => {
    const result = adminTeamParamsSchema.safeParse({ id: '-1' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['id'])
    }
  })

  it('rejects zero id', () => {
    const result = adminTeamParamsSchema.safeParse({ id: '0' })
    expect(result.success).toBe(false)
  })
})
