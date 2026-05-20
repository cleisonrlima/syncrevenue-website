import type { Database } from 'better-sqlite3'
import defaultDb from '../db'

export type LeadStatus = 'pending' | 'contacted' | 'qualified'
export type Locale = 'en' | 'pt-BR' | 'es'
export type Gds =
  | 'Amadeus'
  | 'Sabre'
  | 'Travelport (Galileo/Worldspan)'
  | 'Galileo'
  | 'Worldspan'
  | 'Other'
  | 'None yet'

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

export interface LeadsStats {
  totalLeads: number
  pendingLeads: number
  leadsThisWeek: number
  leadsByLocale: { en: number; 'pt-BR': number; es: number }
}

export interface LeadsDao {
  insert(input: DemoRequestInput): DemoRequestRow
  findRecentByEmail(email: string, withinSeconds?: number): DemoRequestRow | undefined
  list(filter?: { status?: LeadStatus; locale?: Locale; limit?: number; offset?: number }): DemoRequestRow[]
  updateStatus(id: number, status: LeadStatus): DemoRequestRow | undefined
  getById(id: number): DemoRequestRow | undefined
  countStats(): LeadsStats
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
  const totalStmt = database.prepare(`SELECT COUNT(*) AS n FROM demo_requests`)
  const pendingStmt = database.prepare(
    `SELECT COUNT(*) AS n FROM demo_requests WHERE status = 'pending'`
  )
  const thisWeekStmt = database.prepare(
    `SELECT COUNT(*) AS n FROM demo_requests WHERE created_at >= datetime('now', '-7 days')`
  )
  const byLocaleStmt = database.prepare(
    `SELECT locale, COUNT(*) AS n FROM demo_requests GROUP BY locale`
  )
  const countStatsTxn = database.transaction((): LeadsStats => {
    const total = (totalStmt.get() as { n: number }).n
    const pending = (pendingStmt.get() as { n: number }).n
    const thisWeek = (thisWeekStmt.get() as { n: number }).n
    const byLocaleRows = byLocaleStmt.all() as Array<{ locale: string; n: number }>
    const byLocale: LeadsStats['leadsByLocale'] = { en: 0, 'pt-BR': 0, es: 0 }
    for (const row of byLocaleRows) {
      if (row.locale === 'en' || row.locale === 'pt-BR' || row.locale === 'es') {
        byLocale[row.locale] = row.n
      }
    }
    return {
      totalLeads: total,
      pendingLeads: pending,
      leadsThisWeek: thisWeek,
      leadsByLocale: byLocale,
    }
  })

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
    countStats() {
      return countStatsTxn()
    },
  }
}

export const leadsDao = createLeadsDao()
