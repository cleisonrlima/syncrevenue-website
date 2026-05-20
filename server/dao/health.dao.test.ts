// @vitest-environment node
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { createHealthDao, healthDao } from './health.dao'

describe('healthDao', () => {
  let db: Database.Database
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrev-health-dao-'))
    db = new Database(path.join(tempDir, 'health.db'))
  })

  afterEach(() => {
    if (db.open) {
      db.close()
    }
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('ping() returns true on an open database', () => {
    const dao = createHealthDao(db)
    expect(dao.ping()).toBe(true)
  })

  it('ping() throws when the database connection has been closed', () => {
    const dao = createHealthDao(db)
    db.close()
    expect(() => dao.ping()).toThrow()
  })

  it('default healthDao singleton exposes a ping method', () => {
    expect(healthDao).toBeDefined()
    expect(typeof healthDao.ping).toBe('function')
  })
})
