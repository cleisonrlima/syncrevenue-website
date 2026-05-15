// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { initSchema } from '../db'
import { createContactsDao, type ContactInput } from './contacts.dao'

const base: ContactInput = {
  name: 'Pri',
  email: 'pri@example.com',
  subject: 'Hello',
  message: 'Hi there',
  locale: 'en',
}

describe('contactsDao', () => {
  let dao: ReturnType<typeof createContactsDao>
  beforeEach(() => {
    const db = new Database(':memory:')
    initSchema(db)
    dao = createContactsDao(db)
  })

  it('inserts and defaults read=0', () => {
    const row = dao.insert(base)
    expect(row.read).toBe(0)
    expect(row.subject).toBe('Hello')
  })

  it('finds recent by email within 60s', () => {
    dao.insert(base)
    expect(dao.findRecentByEmail(base.email, 60)?.email).toBe(base.email)
  })

  it('markRead toggles flag', () => {
    const r = dao.insert(base)
    const updated = dao.markRead(r.id, 1)
    expect(updated?.read).toBe(1)
  })

  it('list filters by read and locale', () => {
    const a = dao.insert(base)
    dao.insert({ ...base, email: 'es@example.com', locale: 'es' })
    dao.markRead(a.id, 1)
    expect(dao.list({ read: 1 })).toHaveLength(1)
    expect(dao.list({ locale: 'es' })).toHaveLength(1)
  })
})
