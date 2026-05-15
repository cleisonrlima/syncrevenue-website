import type { Database } from 'better-sqlite3'
import defaultDb from '../db'
import type { Locale } from './leads.dao'

export interface ContactInput {
  name: string
  email: string
  subject: string
  message: string
  locale: Locale
}

export interface ContactRow {
  id: number
  name: string
  email: string
  subject: string
  message: string
  locale: Locale
  read: 0 | 1
  created_at: string
}

export interface ContactsDao {
  insert(input: ContactInput): ContactRow
  findRecentByEmail(email: string, withinSeconds?: number): ContactRow | undefined
  list(filter?: { read?: 0 | 1; locale?: Locale; limit?: number; offset?: number }): ContactRow[]
  markRead(id: number, read: 0 | 1): ContactRow | undefined
  getById(id: number): ContactRow | undefined
}

export function createContactsDao(database: Database = defaultDb): ContactsDao {
  const insertStmt = database.prepare(`
    INSERT INTO contacts (name, email, subject, message, locale)
    VALUES (@name, @email, @subject, @message, @locale)
  `)
  const recentByEmailStmt = database.prepare(`
    SELECT * FROM contacts
    WHERE email = ? AND created_at >= datetime('now', ?)
    ORDER BY created_at DESC
    LIMIT 1
  `)
  const getByIdStmt = database.prepare(`SELECT * FROM contacts WHERE id = ?`)
  const markReadStmt = database.prepare(`UPDATE contacts SET read = @read WHERE id = @id`)

  return {
    insert(input) {
      const result = insertStmt.run(input)
      return getByIdStmt.get(Number(result.lastInsertRowid)) as ContactRow
    },
    findRecentByEmail(email, withinSeconds = 60) {
      const offset = `-${Math.max(1, Math.floor(withinSeconds))} seconds`
      return recentByEmailStmt.get(email, offset) as ContactRow | undefined
    },
    list(filter = {}) {
      const where: string[] = []
      const params: Record<string, unknown> = {}
      if (filter.read === 0 || filter.read === 1) {
        where.push('read = @read')
        params.read = filter.read
      }
      if (filter.locale) {
        where.push('locale = @locale')
        params.locale = filter.locale
      }
      const limit = filter.limit ?? 100
      const offset = filter.offset ?? 0
      const sql =
        `SELECT * FROM contacts` +
        (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
        ` ORDER BY created_at DESC LIMIT @limit OFFSET @offset`
      return database.prepare(sql).all({ ...params, limit, offset }) as ContactRow[]
    },
    markRead(id, read) {
      markReadStmt.run({ id, read })
      return getByIdStmt.get(id) as ContactRow | undefined
    },
    getById(id) {
      return getByIdStmt.get(id) as ContactRow | undefined
    },
  }
}

export const contactsDao = createContactsDao()
