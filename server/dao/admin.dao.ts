import type { Database } from 'better-sqlite3'
import defaultDb from '../db'

export interface AdminUserRow {
  id: number
  email: string
  password_hash: string
  created_at: string
}

export interface AdminDao {
  findByEmail(email: string): AdminUserRow | undefined
  findById(id: number): AdminUserRow | undefined
  create(input: { email: string; password_hash: string }): AdminUserRow
  upsert(input: { email: string; password_hash: string }): AdminUserRow
}

export function createAdminDao(database: Database = defaultDb): AdminDao {
  const findByEmailStmt = database.prepare(`SELECT * FROM admin_users WHERE email = ?`)
  const findByIdStmt = database.prepare(`SELECT * FROM admin_users WHERE id = ?`)
  const insertStmt = database.prepare(
    `INSERT INTO admin_users (email, password_hash) VALUES (@email, @password_hash)`
  )
  const updateHashStmt = database.prepare(
    `UPDATE admin_users SET password_hash = @password_hash WHERE email = @email`
  )

  return {
    findByEmail(email) {
      return findByEmailStmt.get(email) as AdminUserRow | undefined
    },
    findById(id) {
      return findByIdStmt.get(id) as AdminUserRow | undefined
    },
    create(input) {
      const result = insertStmt.run(input)
      return findByIdStmt.get(Number(result.lastInsertRowid)) as AdminUserRow
    },
    upsert(input) {
      const existing = findByEmailStmt.get(input.email) as AdminUserRow | undefined
      if (existing) {
        updateHashStmt.run(input)
        return findByEmailStmt.get(input.email) as AdminUserRow
      }
      return this.create(input)
    },
  }
}

export const adminDao = createAdminDao()
