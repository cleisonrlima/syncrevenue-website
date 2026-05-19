// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Express } from 'express'
import type Database from 'better-sqlite3'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { request } from '../test-utils/request'
import type { TeamMemberInput, TeamMemberRow } from '../dao/team.dao'

let app: Express
let currentDb: Database.Database | undefined
let currentTempDir: string | undefined
let teamDao: typeof import('../dao/team.dao').teamDao

const baseInput: TeamMemberInput = {
  name: 'Maria Silva',
  role_en: 'Lead',
  role_pt: 'Líder',
  role_es: 'Líder',
  bio_en: 'bio en',
  bio_pt: 'bio pt',
  bio_es: 'bio es',
  experience_en: '20+ years',
  experience_pt: '20+ anos',
  experience_es: '20+ años',
}

async function createIsolatedApp() {
  vi.resetModules()
  currentTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrev-public-team-db-'))
  process.env.DB_PATH = path.join(currentTempDir, 'test.db')
  process.env.ALLOWED_ORIGIN = 'http://localhost:5173'
  process.env.JWT_SECRET = 'test-secret'

  const [{ createApp }, dbModule, teamDaoModule] = await Promise.all([
    import('../index'),
    import('../db'),
    import('../dao/team.dao'),
  ])
  currentDb = dbModule.default
  teamDao = teamDaoModule.teamDao
  app = createApp()
}

function teardown() {
  try {
    currentDb?.close()
  } catch {
    /* ignore */
  }
  currentDb = undefined
  if (currentTempDir && fs.existsSync(currentTempDir)) {
    fs.rmSync(currentTempDir, { recursive: true, force: true })
  }
  currentTempDir = undefined
}

type RowsBody = { success: true; data: TeamMemberRow[] }

describe('GET /api/team (public)', () => {
  beforeEach(async () => {
    await createIsolatedApp()
  })
  afterEach(() => {
    teardown()
  })

  it('returns 200 with success envelope when empty', async () => {
    const r = await request(app, { method: 'GET', path: '/api/team' })
    expect(r.status).toBe(200)
    const body = r.json<RowsBody>()
    expect(body.success).toBe(true)
    expect(body.data).toEqual([])
  })

  it('returns only active members', async () => {
    const a = teamDao.create({ ...baseInput, name: 'Active' })
    const b = teamDao.create({ ...baseInput, name: 'Inactive' })
    teamDao.setActive(b.id, 0)
    const r = await request(app, { method: 'GET', path: '/api/team' })
    expect(r.status).toBe(200)
    const body = r.json<RowsBody>()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe(a.id)
    expect(body.data[0].active).toBe(1)
    expect(body.data[0].experience_en).toBe('20+ years')
  })

  it('orders by order_index ASC, id ASC', async () => {
    teamDao.create({ ...baseInput, name: 'C', order_index: 3 })
    teamDao.create({ ...baseInput, name: 'A', order_index: 1 })
    teamDao.create({ ...baseInput, name: 'B', order_index: 2 })
    const r = await request(app, { method: 'GET', path: '/api/team' })
    expect(r.status).toBe(200)
    const body = r.json<RowsBody>()
    expect(body.data.map((row) => row.name)).toEqual(['A', 'B', 'C'])
  })

  it('does not require a cookie (public)', async () => {
    teamDao.create(baseInput)
    const r = await request(app, { method: 'GET', path: '/api/team' })
    expect(r.status).toBe(200)
    expect(r.json<RowsBody>().data).toHaveLength(1)
  })
})
