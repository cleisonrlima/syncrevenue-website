// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { initSchema } from '../db'
import { createAuditDao, type AuditRequestInput } from './audit.dao'

function freshDao() {
  const db = new Database(':memory:')
  initSchema(db)
  return { db, dao: createAuditDao(db) }
}

const base: AuditRequestInput = {
  name: 'Marcos',
  email: 'marcos@example.com',
  company: 'Agencia Sirius',
  role: 'Back-office Manager',
  gds: 'Amadeus',
  notes: null,
  locale: 'pt-BR',
}

describe('auditDao', () => {
  let dao: ReturnType<typeof createAuditDao>
  beforeEach(() => {
    ;({ dao } = freshDao())
  })

  it('insert returns typed row with locale and timestamp', () => {
    const row = dao.insert(base)
    expect(row.id).toBeGreaterThan(0)
    expect(row.email).toBe('marcos@example.com')
    expect(row.locale).toBe('pt-BR')
    expect(row.notes).toBeNull()
    expect(typeof row.created_at).toBe('string')
  })

  it('insert preserves optional notes', () => {
    const row = dao.insert({ ...base, notes: 'BSP last 30 days attached' })
    expect(row.notes).toBe('BSP last 30 days attached')
  })

  it('findRecentByEmail returns the insert within window', () => {
    dao.insert(base)
    const found = dao.findRecentByEmail(base.email, 60)
    expect(found?.email).toBe(base.email)
  })

  it('findRecentByEmail returns undefined when nothing matches', () => {
    expect(dao.findRecentByEmail('nobody@example.com', 60)).toBeUndefined()
  })

  it('list filters by locale and paginates', () => {
    dao.insert(base)
    dao.insert({ ...base, email: 'b@example.com', locale: 'es' })
    dao.insert({ ...base, email: 'c@example.com', locale: 'pt-BR' })

    const ptBr = dao.list({ locale: 'pt-BR' })
    expect(ptBr).toHaveLength(2)

    const firstPage = dao.list({ limit: 1, offset: 0 })
    expect(firstPage).toHaveLength(1)
    const secondPage = dao.list({ limit: 1, offset: 1 })
    expect(secondPage).toHaveLength(1)
    expect(firstPage[0].id).not.toBe(secondPage[0].id)
  })

  it('list defaults to all locales sorted by created_at desc', () => {
    dao.insert(base)
    dao.insert({ ...base, email: 'b@example.com', locale: 'es' })
    const rows = dao.list()
    expect(rows).toHaveLength(2)
    expect(rows[0].created_at >= rows[1].created_at).toBe(true)
  })

  it('getById returns the row or undefined', () => {
    const inserted = dao.insert(base)
    expect(dao.getById(inserted.id)?.email).toBe(base.email)
    expect(dao.getById(99999)).toBeUndefined()
  })

  it('rejects invalid locale via CHECK constraint', () => {
    expect(() => dao.insert({ ...base, locale: 'fr' as unknown as 'en' })).toThrow()
  })
})
