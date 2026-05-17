import type { Database } from 'better-sqlite3'
import defaultDb from '../db'

export interface AdminLoginAttemptRow {
  email: string
  failed_count: number
  last_failed_at: string
}

export interface AdminLoginAttemptsDao {
  getByEmail(email: string): AdminLoginAttemptRow | undefined
  recordFailure(email: string, now?: Date, windowMs?: number): AdminLoginAttemptRow
  reset(email: string): void
  isLocked(email: string, windowMs: number, threshold: number, now?: Date): boolean
}

function toIsoSqlite(date: Date): string {
  // SQLite datetime('now') uses 'YYYY-MM-DD HH:MM:SS' UTC.
  // Match that format so string comparison with last_failed_at remains correct.
  const iso = date.toISOString()
  return iso.slice(0, 10) + ' ' + iso.slice(11, 19)
}

export function createAdminLoginAttemptsDao(database: Database = defaultDb): AdminLoginAttemptsDao {
  const getStmt = database.prepare(`SELECT * FROM admin_login_attempts WHERE email = ?`)
  const incrementStmt = database.prepare(`
    INSERT INTO admin_login_attempts (email, failed_count, last_failed_at)
    VALUES (@email, 1, @ts)
    ON CONFLICT(email) DO UPDATE SET
      failed_count = failed_count + 1,
      last_failed_at = @ts
  `)
  const restartWindowStmt = database.prepare(`
    INSERT INTO admin_login_attempts (email, failed_count, last_failed_at)
    VALUES (@email, 1, @ts)
    ON CONFLICT(email) DO UPDATE SET
      failed_count = 1,
      last_failed_at = @ts
  `)
  const deleteStmt = database.prepare(`DELETE FROM admin_login_attempts WHERE email = ?`)

  return {
    getByEmail(email) {
      return getStmt.get(email) as AdminLoginAttemptRow | undefined
    },
    recordFailure(email, now = new Date(), windowMs) {
      const ts = toIsoSqlite(now)
      const row = getStmt.get(email) as AdminLoginAttemptRow | undefined
      const lastMs = row ? Date.parse(row.last_failed_at.replace(' ', 'T') + 'Z') : NaN
      if (row && windowMs !== undefined && !Number.isNaN(lastMs) && now.getTime() - lastMs >= windowMs) {
        restartWindowStmt.run({ email, ts })
      } else {
        incrementStmt.run({ email, ts })
      }
      return getStmt.get(email) as AdminLoginAttemptRow
    },
    reset(email) {
      deleteStmt.run(email)
    },
    isLocked(email, windowMs, threshold, now = new Date()) {
      const row = getStmt.get(email) as AdminLoginAttemptRow | undefined
      if (!row) return false
      if (row.failed_count < threshold) return false
      const lastMs = Date.parse(row.last_failed_at.replace(' ', 'T') + 'Z')
      if (Number.isNaN(lastMs)) return false
      return now.getTime() - lastMs < windowMs
    },
  }
}

export const adminLoginAttemptsDao = createAdminLoginAttemptsDao()
