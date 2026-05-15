// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { initSchema } from '../db'
import { createTeamDao } from './team.dao'

const base = {
  name: 'Pri',
  role_en: 'CEO',
  role_pt: 'CEO',
  role_es: 'CEO',
  bio_en: 'en bio',
  bio_pt: 'pt bio',
  bio_es: 'es bio',
}

describe('teamDao', () => {
  let dao: ReturnType<typeof createTeamDao>
  beforeEach(() => {
    const db = new Database(':memory:')
    initSchema(db)
    dao = createTeamDao(db)
  })

  it('creates with defaults active=1, order_index=0', () => {
    const row = dao.create(base)
    expect(row.active).toBe(1)
    expect(row.order_index).toBe(0)
    expect(row.linkedin).toBeNull()
  })

  it('lists in order_index ascending', () => {
    dao.create({ ...base, name: 'B', order_index: 2 })
    dao.create({ ...base, name: 'A', order_index: 1 })
    const list = dao.list()
    expect(list.map((r) => r.name)).toEqual(['A', 'B'])
  })

  it('list activeOnly filters inactive', () => {
    const a = dao.create({ ...base, name: 'Active' })
    const b = dao.create({ ...base, name: 'Hidden' })
    dao.setActive(b.id, 0)
    const visible = dao.list({ activeOnly: true })
    expect(visible.map((r) => r.id)).toEqual([a.id])
  })

  it('update patches whitelisted fields', () => {
    const r = dao.create(base)
    const updated = dao.update(r.id, { name: 'New', bio_en: 'x' })
    expect(updated?.name).toBe('New')
    expect(updated?.bio_en).toBe('x')
  })

  it('setActive toggles', () => {
    const r = dao.create(base)
    expect(dao.setActive(r.id, 0)?.active).toBe(0)
    expect(dao.setActive(r.id, 1)?.active).toBe(1)
  })
})
