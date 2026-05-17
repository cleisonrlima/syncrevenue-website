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

  // Story 4.8 — token_version semantics
  it('create initialises token_version at 0', () => {
    const row = dao.create({ email: 'a@b.com', password_hash: 'h' })
    expect(row.token_version).toBe(0)
  })

  it('upsert of new row does not pre-bump token_version (stays 0)', () => {
    const row = dao.upsert({ email: 'a@b.com', password_hash: 'h' })
    expect(row.token_version).toBe(0)
  })

  it('upsert of existing row bumps token_version by 1 per call', () => {
    dao.create({ email: 'a@b.com', password_hash: 'h0' })
    expect(dao.upsert({ email: 'a@b.com', password_hash: 'h1' }).token_version).toBe(1)
    expect(dao.upsert({ email: 'a@b.com', password_hash: 'h2' }).token_version).toBe(2)
    expect(dao.upsert({ email: 'a@b.com', password_hash: 'h3' }).token_version).toBe(3)
  })

  it('upsert of existing row bumps token_version even when password_hash unchanged', () => {
    dao.create({ email: 'a@b.com', password_hash: 'same' })
    expect(dao.upsert({ email: 'a@b.com', password_hash: 'same' }).token_version).toBe(1)
    expect(dao.upsert({ email: 'a@b.com', password_hash: 'same' }).token_version).toBe(2)
  })

  it('incrementTokenVersion returns the updated row when present', () => {
    dao.create({ email: 'a@b.com', password_hash: 'h' })
    const updated = dao.incrementTokenVersion('a@b.com')
    expect(updated?.token_version).toBe(1)
  })

  it('incrementTokenVersion returns undefined when email is unknown', () => {
    expect(dao.incrementTokenVersion('ghost@b.com')).toBeUndefined()
  })

  it('deleteByEmail removes the row', () => {
    dao.create({ email: 'a@b.com', password_hash: 'h' })
    dao.deleteByEmail('a@b.com')
    expect(dao.findByEmail('a@b.com')).toBeUndefined()
  })
})
