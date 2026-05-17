// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { initSchema } from './db'
import { createAdminDao } from './dao/admin.dao'
import { createTeamDao } from './dao/team.dao'
import { DEFAULT_TEAM_MEMBERS, seedAdminUser, seedTeamMembers } from './db.seed'

describe('seedAdminUser', () => {
  let dao: ReturnType<typeof createAdminDao>

  beforeEach(() => {
    const db = new Database(':memory:')
    initSchema(db)
    dao = createAdminDao(db)
  })

  it('creates admin row on first run', () => {
    const result = seedAdminUser({
      email: 'admin@example.com',
      password: 'correcthorse',
      dao,
      saltRounds: 4,
    })
    expect(result.action).toBe('created')
    expect(result.user.email).toBe('admin@example.com')
    expect(bcrypt.compareSync('correcthorse', result.user.password_hash)).toBe(true)
  })

  it('is idempotent — same email does not duplicate row', () => {
    seedAdminUser({ email: 'a@b.com', password: 'p1', dao, saltRounds: 4 })
    const second = seedAdminUser({ email: 'a@b.com', password: 'p1', dao, saltRounds: 4 })
    expect(second.action).toBe('updated')
    expect(dao.findByEmail('a@b.com')).toBeDefined()
  })

  it('refreshes password hash on re-run with new password', () => {
    seedAdminUser({ email: 'a@b.com', password: 'oldpw', dao, saltRounds: 4 })
    const updated = seedAdminUser({ email: 'a@b.com', password: 'newpw', dao, saltRounds: 4 })
    expect(updated.action).toBe('updated')
    expect(bcrypt.compareSync('newpw', updated.user.password_hash)).toBe(true)
    expect(bcrypt.compareSync('oldpw', updated.user.password_hash)).toBe(false)
  })

  it('throws when ADMIN_EMAIL missing', () => {
    expect(() => seedAdminUser({ password: 'x', dao })).toThrow(/ADMIN_EMAIL/)
  })

  it('throws when ADMIN_PASSWORD missing', () => {
    expect(() => seedAdminUser({ email: 'a@b.com', dao })).toThrow(/ADMIN_PASSWORD/)
  })

  it('uses salt rounds 12 by default', () => {
    const result = seedAdminUser({
      email: 'a@b.com',
      password: 'p',
      dao,
    })
    expect(bcrypt.getRounds(result.user.password_hash)).toBe(12)
  })

  // Story 4.8 — token_version revocation semantics
  it('seeds first run with token_version = 0', () => {
    const result = seedAdminUser({
      email: 'a@b.com',
      password: 'p',
      dao,
      saltRounds: 4,
    })
    expect(result.action).toBe('created')
    expect(result.user.token_version).toBe(0)
  })

  it('bumps token_version on each subsequent seed (new password)', () => {
    seedAdminUser({ email: 'a@b.com', password: 'p0', dao, saltRounds: 4 })
    const second = seedAdminUser({ email: 'a@b.com', password: 'p1', dao, saltRounds: 4 })
    expect(second.action).toBe('updated')
    expect(second.user.token_version).toBe(1)
    const third = seedAdminUser({ email: 'a@b.com', password: 'p2', dao, saltRounds: 4 })
    expect(third.user.token_version).toBe(2)
  })

  it('bumps token_version on same-password re-seed (documented trade-off)', () => {
    seedAdminUser({ email: 'a@b.com', password: 'same', dao, saltRounds: 4 })
    const second = seedAdminUser({ email: 'a@b.com', password: 'same', dao, saltRounds: 4 })
    expect(second.user.token_version).toBe(1)
  })
})

describe('seedTeamMembers', () => {
  let teamDao: ReturnType<typeof createTeamDao>

  beforeEach(() => {
    const db = new Database(':memory:')
    initSchema(db)
    teamDao = createTeamDao(db)
  })

  it('inserts the default members on empty table', () => {
    const result = seedTeamMembers({ dao: teamDao })
    expect(result.inserted).toBe(DEFAULT_TEAM_MEMBERS.length)
    expect(result.skipped).toBe(0)
    const list = teamDao.list()
    expect(list).toHaveLength(DEFAULT_TEAM_MEMBERS.length)
    expect(list.map((row) => row.name)).toEqual(DEFAULT_TEAM_MEMBERS.map((m) => m.name))
  })

  it('is idempotent — returns skipped count on second run', () => {
    seedTeamMembers({ dao: teamDao })
    const second = seedTeamMembers({ dao: teamDao })
    expect(second.inserted).toBe(0)
    expect(second.skipped).toBe(DEFAULT_TEAM_MEMBERS.length)
    expect(teamDao.list()).toHaveLength(DEFAULT_TEAM_MEMBERS.length)
  })

  it('seeded members surface via list({ activeOnly: true })', () => {
    seedTeamMembers({ dao: teamDao })
    const active = teamDao.list({ activeOnly: true })
    expect(active).toHaveLength(DEFAULT_TEAM_MEMBERS.length)
    for (const row of active) {
      expect(row.active).toBe(1)
    }
  })

  it('preserves order_index ordering after seed', () => {
    seedTeamMembers({ dao: teamDao })
    const list = teamDao.list()
    const orders = list.map((r) => r.order_index)
    const sorted = [...orders].sort((a, b) => a - b)
    expect(orders).toEqual(sorted)
  })
})
