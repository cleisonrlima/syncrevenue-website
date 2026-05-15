// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { initSchema } from './db'

function freshDb() {
  const db = new Database(':memory:')
  initSchema(db)
  return db
}

describe('initSchema', () => {
  let db: Database.Database
  beforeEach(() => {
    db = freshDb()
  })

  it('creates all four tables', () => {
    const rows = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('demo_requests','contacts','team_members','admin_users')`
      )
      .all() as { name: string }[]
    expect(rows.map((r) => r.name).sort()).toEqual(
      ['admin_users', 'contacts', 'demo_requests', 'team_members'].sort()
    )
  })

  it('demo_requests rejects invalid locale via CHECK', () => {
    expect(() =>
      db
        .prepare(
          `INSERT INTO demo_requests (name,email,company,role,gds,locale) VALUES (?,?,?,?,?,?)`
        )
        .run('A', 'a@b.com', 'C', 'CEO', 'Amadeus', 'fr')
    ).toThrow(/CHECK/i)
  })

  it('demo_requests rejects invalid gds via CHECK', () => {
    expect(() =>
      db
        .prepare(
          `INSERT INTO demo_requests (name,email,company,role,gds,locale) VALUES (?,?,?,?,?,?)`
        )
        .run('A', 'a@b.com', 'C', 'CEO', 'Nope', 'en')
    ).toThrow(/CHECK/i)
  })

  it('demo_requests rejects invalid status via CHECK', () => {
    expect(() =>
      db
        .prepare(
          `INSERT INTO demo_requests (name,email,company,role,gds,locale,status) VALUES (?,?,?,?,?,?,?)`
        )
        .run('A', 'a@b.com', 'C', 'CEO', 'Amadeus', 'en', 'spam')
    ).toThrow(/CHECK/i)
  })

  it('contacts rejects invalid read via CHECK', () => {
    expect(() =>
      db
        .prepare(
          `INSERT INTO contacts (name,email,subject,message,locale,read) VALUES (?,?,?,?,?,?)`
        )
        .run('A', 'a@b.com', 's', 'm', 'en', 2)
    ).toThrow(/CHECK/i)
  })

  it('team_members rejects invalid active via CHECK', () => {
    expect(() =>
      db
        .prepare(
          `INSERT INTO team_members (name,role_en,role_pt,role_es,bio_en,bio_pt,bio_es,active) VALUES (?,?,?,?,?,?,?,?)`
        )
        .run('n', 'r', 'r', 'r', 'b', 'b', 'b', 2)
    ).toThrow(/CHECK/i)
  })

  it('admin_users enforces UNIQUE email', () => {
    db.prepare(`INSERT INTO admin_users (email, password_hash) VALUES (?,?)`).run('a@b.com', 'h')
    expect(() =>
      db.prepare(`INSERT INTO admin_users (email, password_hash) VALUES (?,?)`).run('a@b.com', 'h2')
    ).toThrow(/UNIQUE/i)
  })

  it('is idempotent', () => {
    expect(() => initSchema(db)).not.toThrow()
    expect(() => initSchema(db)).not.toThrow()
  })
})
