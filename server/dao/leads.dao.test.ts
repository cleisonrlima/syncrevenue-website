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
})
