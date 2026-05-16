// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { loginSchema } from './admin-auth.schema'

describe('loginSchema', () => {
  it('accepts valid payload', () => {
    const result = loginSchema.safeParse({ email: 'admin@example.com', password: 'hunter2' })
    expect(result.success).toBe(true)
  })

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({ password: 'x' })
    expect(result.success).toBe(false)
  })

  it('rejects non-email email', () => {
    const result = loginSchema.safeParse({ email: 'notanemail', password: 'x' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['email'])
    }
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['password'])
    }
  })

  it('trims email whitespace', () => {
    const result = loginSchema.safeParse({ email: '  admin@example.com  ', password: 'x' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('admin@example.com')
    }
  })
})
