import { describe, it, expect } from 'vitest'
import {
  adminLeadStatusBodySchema,
  adminLeadStatusParamsSchema,
} from './admin-lead-status.schema'

describe('adminLeadStatusBodySchema', () => {
  it('accepts each valid status value', () => {
    for (const status of ['pending', 'contacted', 'qualified'] as const) {
      const result = adminLeadStatusBodySchema.safeParse({ status })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.status).toBe(status)
    }
  })

  it('rejects invalid status with issue path ["status"]', () => {
    const result = adminLeadStatusBodySchema.safeParse({ status: 'archived' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['status'])
    }
  })

  it('rejects missing status with issue path ["status"]', () => {
    const result = adminLeadStatusBodySchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['status'])
    }
  })

  it('silently ignores unknown body keys', () => {
    const result = adminLeadStatusBodySchema.safeParse({ status: 'qualified', foo: 'bar' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ status: 'qualified' })
      expect('foo' in result.data).toBe(false)
    }
  })
})

describe('adminLeadStatusParamsSchema', () => {
  it('coerces numeric string id', () => {
    const result = adminLeadStatusParamsSchema.safeParse({ id: '42' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.id).toBe(42)
  })

  it('rejects non-numeric id with issue path ["id"]', () => {
    const result = adminLeadStatusParamsSchema.safeParse({ id: 'abc' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['id'])
    }
  })

  it('rejects negative id with issue path ["id"]', () => {
    const result = adminLeadStatusParamsSchema.safeParse({ id: '-1' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['id'])
    }
  })

  it('rejects zero id with issue path ["id"]', () => {
    const result = adminLeadStatusParamsSchema.safeParse({ id: '0' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['id'])
    }
  })

  it('rejects non-integer id with issue path ["id"]', () => {
    const result = adminLeadStatusParamsSchema.safeParse({ id: '3.5' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['id'])
    }
  })
})
