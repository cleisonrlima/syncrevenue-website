import type { Database } from 'better-sqlite3'
import defaultDb from '../db'

export type Locale = 'en' | 'pt-BR' | 'es'

export interface AuditRequestInput {
  name: string
  email: string
  company: string
  role: string
  gds: string
  notes?: string | null
  locale: Locale
}

export interface AuditRequestRow {
  id: number
  name: string
  email: string
  company: string
  role: string
  gds: string
  notes: string | null
  locale: Locale
  created_at: string
}

export interface AuditDao {
  insert(input: AuditRequestInput): AuditRequestRow
  findRecentByEmail(email: string, withinSeconds?: number): AuditRequestRow | undefined
  list(filter?: { locale?: Locale; limit?: number; offset?: number }): AuditRequestRow[]
  getById(id: number): AuditRequestRow | undefined
}

export function createAuditDao(database: Database = defaultDb): AuditDao {
  const insertStmt = database.prepare(`
    INSERT INTO audit_requests (name, email, company, role, gds, notes, locale)
    VALUES (@name, @email, @company, @role, @gds, @notes, @locale)
  `)
  const recentByEmailStmt = database.prepare(`
    SELECT * FROM audit_requests
    WHERE email = ? AND created_at >= datetime('now', ?)
    ORDER BY created_at DESC
    LIMIT 1
  `)
  const getByIdStmt = database.prepare(`SELECT * FROM audit_requests WHERE id = ?`)

  return {
    insert(input) {
      const result = insertStmt.run({
        name: input.name,
        email: input.email,
        company: input.company,
        role: input.role,
        gds: input.gds,
        notes: input.notes ?? null,
        locale: input.locale,
      })
      return getByIdStmt.get(Number(result.lastInsertRowid)) as AuditRequestRow
    },
    findRecentByEmail(email, withinSeconds = 60) {
      const offset = `-${Math.max(1, Math.floor(withinSeconds))} seconds`
      return recentByEmailStmt.get(email, offset) as AuditRequestRow | undefined
    },
    list(filter = {}) {
      const where: string[] = []
      const params: Record<string, unknown> = {}
      if (filter.locale) {
        where.push('locale = @locale')
        params.locale = filter.locale
      }
      const limit = filter.limit ?? 100
      const offset = filter.offset ?? 0
      const sql =
        `SELECT * FROM audit_requests` +
        (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
        ` ORDER BY created_at DESC LIMIT @limit OFFSET @offset`
      return database.prepare(sql).all({ ...params, limit, offset }) as AuditRequestRow[]
    },
    getById(id) {
      return getByIdStmt.get(id) as AuditRequestRow | undefined
    },
  }
}

export const auditDao = createAuditDao()
