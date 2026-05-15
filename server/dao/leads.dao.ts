import type { Database } from 'better-sqlite3'
import defaultDb from '../db'

export type LeadStatus = 'pending' | 'contacted' | 'qualified'
export type Locale = 'en' | 'pt-BR' | 'es'
export type Gds = 'Amadeus' | 'Sabre' | 'Galileo' | 'Worldspan' | 'Other' | 'None yet'

export interface DemoRequestInput {
  name: string
  email: string
  company: string
  phone?: string | null
  role: string
  gds: Gds
  message?: string | null
  locale: Locale
}

export interface DemoRequestRow {
  id: number
  name: string
  email: string
  company: string
  phone: string | null
  role: string
  gds: Gds
  message: string | null
  locale: Locale
  status: LeadStatus
  created_at: string
  updated_at: string
}

export interface LeadsDao {
  insert(input: DemoRequestInput): DemoRequestRow
  findRecentByEmail(email: string, withinSeconds?: number): DemoRequestRow | undefined
  list(filter?: { status?: LeadStatus; locale?: Locale; limit?: number; offset?: number }): DemoRequestRow[]
  updateStatus(id: number, status: LeadStatus): DemoRequestRow | undefined
  getById(id: number): DemoRequestRow | undefined
}

export function createLeadsDao(database: Database = defaultDb): LeadsDao {
  const insertStmt = database.prepare(`
    INSERT INTO demo_requests (name, email, company, phone, role, gds, message, locale)
    VALUES (@name, @email, @company, @phone, @role, @gds, @message, @locale)
  `)
  const recentByEmailStmt = database.prepare(`
    SELECT * FROM demo_requests
    WHERE email = ? AND created_at >= datetime('now', ?)
    ORDER BY created_at DESC
    LIMIT 1
  `)
  const getByIdStmt = database.prepare(`SELECT * FROM demo_requests WHERE id = ?`)
  const updateStatusStmt = database.prepare(`
    UPDATE demo_requests
    SET status = @status, updated_at = datetime('now')
    WHERE id = @id
  `)

  return {
    insert(input) {
      const result = insertStmt.run({
        name: input.name,
        email: input.email,
        company: input.company,
        phone: input.phone ?? null,
        role: input.role,
        gds: input.gds,
        message: input.message ?? null,
        locale: input.locale,
      })
      return getByIdStmt.get(Number(result.lastInsertRowid)) as DemoRequestRow
    },
    findRecentByEmail(email, withinSeconds = 60) {
      const offset = `-${Math.max(1, Math.floor(withinSeconds))} seconds`
      return recentByEmailStmt.get(email, offset) as DemoRequestRow | undefined
    },
    list(filter = {}) {
      const where: string[] = []
      const params: Record<string, unknown> = {}
      if (filter.status) {
        where.push('status = @status')
        params.status = filter.status
      }
      if (filter.locale) {
        where.push('locale = @locale')
        params.locale = filter.locale
      }
      const limit = filter.limit ?? 100
      const offset = filter.offset ?? 0
      const sql =
        `SELECT * FROM demo_requests` +
        (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
        ` ORDER BY created_at DESC LIMIT @limit OFFSET @offset`
      return database.prepare(sql).all({ ...params, limit, offset }) as DemoRequestRow[]
    },
    updateStatus(id, status) {
      updateStatusStmt.run({ id, status })
      return getByIdStmt.get(id) as DemoRequestRow | undefined
    },
    getById(id) {
      return getByIdStmt.get(id) as DemoRequestRow | undefined
    },
  }
}

export const leadsDao = createLeadsDao()
