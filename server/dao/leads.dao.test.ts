// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { initSchema } from '../db'
import { createLeadsDao, type DemoRequestInput } from './leads.dao'

function freshDao() {
  const db = new Database(':memory:')
  initSchema(db)
  return { db, dao: createLeadsDao(db) }
}

const base: DemoRequestInput = {
  name: 'Pri',
  email: 'pri@example.com',
  company: 'ACME',
  phone: null,
  role: 'CEO',
  gds: 'Amadeus',
  message: null,
  locale: 'en',
}

describe('leadsDao', () => {
  let dao: ReturnType<typeof createLeadsDao>
  beforeEach(() => {
    ;({ dao } = freshDao())
  })

  it('insert returns typed row with default status pending', () => {
    const row = dao.insert(base)
    expect(row.id).toBeGreaterThan(0)
    expect(row.status).toBe('pending')
    expect(row.locale).toBe('en')
    expect(row.email).toBe('pri@example.com')
  })

  it('findRecentByEmail returns recent insert within 60s', () => {
    dao.insert(base)
    const found = dao.findRecentByEmail(base.email, 60)
    expect(found?.email).toBe(base.email)
  })

  it('findRecentByEmail returns undefined when nothing matches', () => {
    expect(dao.findRecentByEmail('nobody@example.com', 60)).toBeUndefined()
  })

  it('list filters by status and locale', () => {
    dao.insert(base)
    dao.insert({ ...base, email: 'b@example.com', locale: 'es' })
    expect(dao.list({ locale: 'es' })).toHaveLength(1)
    expect(dao.list({ status: 'pending' })).toHaveLength(2)
    expect(dao.list({ status: 'qualified' })).toHaveLength(0)
  })

  it('updateStatus updates and returns row', () => {
    const row = dao.insert(base)
    const updated = dao.updateStatus(row.id, 'qualified')
    expect(updated?.status).toBe('qualified')
  })

  describe('countStats (Story 4.6)', () => {
    it('returns all zeros + all three locale keys present on empty DB', () => {
      const stats = dao.countStats()
      expect(stats).toEqual({
        totalLeads: 0,
        pendingLeads: 0,
        leadsThisWeek: 0,
        leadsByLocale: { en: 0, 'pt-BR': 0, es: 0 },
      })
    })

    it('returns correct counts for mixed data', () => {
      dao.insert(base) // en, pending
      dao.insert({ ...base, email: 'b@example.com', locale: 'pt-BR' }) // pt-BR, pending
      dao.insert({ ...base, email: 'c@example.com', locale: 'pt-BR' }) // pt-BR, pending
      dao.insert({ ...base, email: 'd@example.com', locale: 'es' }) // es, pending

      const stats = dao.countStats()
      expect(stats.totalLeads).toBe(4)
      expect(stats.pendingLeads).toBe(4)
      expect(stats.leadsThisWeek).toBe(4)
      expect(stats.leadsByLocale).toEqual({ en: 1, 'pt-BR': 2, es: 1 })
    })

    it('leadsThisWeek excludes rows backdated past 7 days (direct UPDATE)', () => {
      const { db: localDb, dao: localDao } = freshDao()
      const recent = localDao.insert(base)
      const old = localDao.insert({ ...base, email: 'old@example.com' })
      localDb
        .prepare("UPDATE demo_requests SET created_at = datetime('now', '-30 days') WHERE id = ?")
        .run(old.id)
      const stats = localDao.countStats()
      expect(stats.totalLeads).toBe(2)
      expect(stats.leadsThisWeek).toBe(1)
      // recent row still in week
      expect(localDao.getById(recent.id)?.created_at).toBeDefined()
    })

    it('pendingLeads excludes contacted / qualified rows', () => {
      const a = dao.insert(base)
      const b = dao.insert({ ...base, email: 'b@example.com' })
      dao.insert({ ...base, email: 'c@example.com' })
      dao.updateStatus(a.id, 'contacted')
      dao.updateStatus(b.id, 'qualified')
      const stats = dao.countStats()
      expect(stats.totalLeads).toBe(3)
      expect(stats.pendingLeads).toBe(1)
    })

    it('leadsByLocale returns 0 for locales with no rows', () => {
      dao.insert({ ...base, locale: 'en' })
      const stats = dao.countStats()
      expect(stats.leadsByLocale).toEqual({ en: 1, 'pt-BR': 0, es: 0 })
    })
  })
})
