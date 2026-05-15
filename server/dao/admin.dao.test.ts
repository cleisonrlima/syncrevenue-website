// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { initSchema } from '../db'
import { createAdminDao } from './admin.dao'

describe('adminDao', () => {
  let dao: ReturnType<typeof createAdminDao>
  beforeEach(() => {
    const db = new Database(':memory:')
    initSchema(db)
    dao = createAdminDao(db)
  })

  it('create + findByEmail', () => {
    const row = dao.create({ email: 'admin@example.com', password_hash: 'hash' })
    expect(row.id).toBeGreaterThan(0)
    expect(dao.findByEmail('admin@example.com')?.email).toBe('admin@example.com')
  })

  it('findByEmail returns undefined when missing', () => {
    expect(dao.findByEmail('nope@example.com')).toBeUndefined()
  })

  it('upsert replaces password_hash when email exists', () => {
    dao.create({ email: 'a@b.com', password_hash: 'old' })
    const updated = dao.upsert({ email: 'a@b.com', password_hash: 'new' })
    expect(updated.password_hash).toBe('new')
    expect(dao.findByEmail('a@b.com')?.password_hash).toBe('new')
  })

  it('upsert creates when missing', () => {
    const created = dao.upsert({ email: 'fresh@b.com', password_hash: 'h' })
    expect(created.password_hash).toBe('h')
  })
})
