// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { initSchema } from '../db'
import { createAdminLoginAttemptsDao } from './admin-login-attempts.dao'

describe('adminLoginAttemptsDao', () => {
  let dao: ReturnType<typeof createAdminLoginAttemptsDao>

  beforeEach(() => {
    const db = new Database(':memory:')
    initSchema(db)
    dao = createAdminLoginAttemptsDao(db)
  })

  it('recordFailure inserts row with count 1 on first call', () => {
    const now = new Date('2026-05-16T10:00:00.000Z')
    const row = dao.recordFailure('admin@example.com', now)
    expect(row.failed_count).toBe(1)
    expect(row.email).toBe('admin@example.com')
  })

  it('recordFailure increments existing row and bumps timestamp', () => {
    const t1 = new Date('2026-05-16T10:00:00.000Z')
    const t2 = new Date('2026-05-16T10:05:00.000Z')
    dao.recordFailure('admin@example.com', t1)
    const row = dao.recordFailure('admin@example.com', t2)
    expect(row.failed_count).toBe(2)
    expect(row.last_failed_at).toBe('2026-05-16 10:05:00')
  })

  it('recordFailure restarts the counter when the previous failure window expired', () => {
    const t1 = new Date('2026-05-16T10:00:00.000Z')
    const t2 = new Date('2026-05-16T10:20:00.000Z')
    for (let i = 0; i < 5; i++) dao.recordFailure('admin@example.com', t1, 15 * 60 * 1000)
    const row = dao.recordFailure('admin@example.com', t2, 15 * 60 * 1000)
    expect(row.failed_count).toBe(1)
    expect(row.last_failed_at).toBe('2026-05-16 10:20:00')
  })

  it('reset deletes the row', () => {
    dao.recordFailure('admin@example.com')
    dao.reset('admin@example.com')
    expect(dao.getByEmail('admin@example.com')).toBeUndefined()
  })

  it('isLocked returns false when no row exists', () => {
    expect(dao.isLocked('ghost@example.com', 15 * 60 * 1000, 5)).toBe(false)
  })

  it('isLocked returns false when failed_count below threshold', () => {
    const now = new Date('2026-05-16T10:00:00.000Z')
    for (let i = 0; i < 4; i++) dao.recordFailure('admin@example.com', now)
    expect(dao.isLocked('admin@example.com', 15 * 60 * 1000, 5, now)).toBe(false)
  })

  it('isLocked returns true when threshold reached and within window', () => {
    const t0 = new Date('2026-05-16T10:00:00.000Z')
    for (let i = 0; i < 5; i++) dao.recordFailure('admin@example.com', t0)
    const tNow = new Date('2026-05-16T10:10:00.000Z')
    expect(dao.isLocked('admin@example.com', 15 * 60 * 1000, 5, tNow)).toBe(true)
  })

  it('isLocked returns false when last failure older than window', () => {
    const t0 = new Date('2026-05-16T10:00:00.000Z')
    for (let i = 0; i < 5; i++) dao.recordFailure('admin@example.com', t0)
    const tFar = new Date('2026-05-16T10:20:00.000Z')
    expect(dao.isLocked('admin@example.com', 15 * 60 * 1000, 5, tFar)).toBe(false)
  })
})
