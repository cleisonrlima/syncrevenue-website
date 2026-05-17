// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Express } from 'express'
import type Database from 'better-sqlite3'
import path from 'path'
import os from 'os'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import { request } from '../../test-utils/request'
import { AUTH_COOKIE_NAME } from '../../middleware/auth'
import type { DemoRequestInput, DemoRequestRow, LeadStatus, Locale } from '../../dao/leads.dao'

const PLAINTEXT = 'correcthorsebatterystaple'
const ADMIN_EMAIL = 'admin@example.com'

let app: Express
let currentDb: Database.Database | undefined
let currentTempDir: string | undefined
let leadsDao: typeof import('../../dao/leads.dao').leadsDao

const SEED_LEADS: Array<Pick<DemoRequestInput, 'name' | 'email' | 'company' | 'role' | 'gds' | 'message' | 'locale'> & { status: LeadStatus }> = [
  { name: 'Alice EN', email: 'alice@a.com', company: 'A', role: 'Owner', gds: 'Amadeus', message: 'hello en', locale: 'en', status: 'pending' },
  { name: 'Bruno PT', email: 'bruno@b.com', company: 'B', role: 'Finance', gds: 'Sabre', message: 'oi pt', locale: 'pt-BR', status: 'pending' },
  { name: 'Clara PT', email: 'clara@c.com', company: 'C', role: 'Owner', gds: 'Galileo', message: 'oi pt 2', locale: 'pt-BR', status: 'contacted' },
  { name: 'Diego ES', email: 'diego@d.com', company: 'D', role: 'Operations', gds: 'Worldspan', message: 'hola es', locale: 'es', status: 'qualified' },
]

async function createIsolatedApp() {
  vi.resetModules()
  currentTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrev-admin-leads-db-'))
  process.env.DB_PATH = path.join(currentTempDir, 'test.db')
  process.env.ALLOWED_ORIGIN = 'http://localhost:5173'
  process.env.JWT_SECRET = 'test-secret'

  const [{ createApp }, dbModule, adminDaoModule, leadsDaoModule] = await Promise.all([
    import('../../index'),
    import('../../db'),
    import('../../dao/admin.dao'),
    import('../../dao/leads.dao'),
  ])
  currentDb = dbModule.default
  adminDaoModule.adminDao.create({
    email: ADMIN_EMAIL,
    password_hash: bcrypt.hashSync(PLAINTEXT, 12),
  })
  leadsDao = leadsDaoModule.leadsDao
  for (const seed of SEED_LEADS) {
    const inserted = leadsDao.insert({
      name: seed.name,
      email: seed.email,
      company: seed.company,
      role: seed.role,
      gds: seed.gds,
      message: seed.message ?? null,
      locale: seed.locale,
    })
    if (seed.status !== 'pending') {
      leadsDao.updateStatus(inserted.id, seed.status)
    }
  }
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

function extractCookieValue(setCookie: string | string[] | undefined, name: string): string | undefined {
  if (!setCookie) return undefined
  const headers = Array.isArray(setCookie) ? setCookie : [setCookie]
  const match = headers.find(h => h.startsWith(`${name}=`))
  if (!match) return undefined
  return match.split(';')[0].slice(name.length + 1)
}

async function loginAndGetCookie(): Promise<string> {
  const r = await request(app, {
    method: 'POST',
    path: '/api/admin/auth/login',
    body: { email: ADMIN_EMAIL, password: PLAINTEXT },
  })
  const token = extractCookieValue(r.headers['set-cookie'] as string | string[] | undefined, AUTH_COOKIE_NAME)
  if (!token) throw new Error('login did not return admin_token cookie')
  return token
}

async function authedGet(pathWithQuery: string, token: string) {
  return request(app, {
    method: 'GET',
    path: pathWithQuery,
    headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
  })
}

async function authedPatch(
  pathWithQuery: string,
  token: string,
  body: Record<string, unknown> | string | undefined
) {
  return request(app, {
    method: 'PATCH',
    path: pathWithQuery,
    headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
    body,
  })
}

type LeadsBody = { success: true; data: DemoRequestRow[] }
type LeadBody = { success: true; data: DemoRequestRow }
type ErrBody = { success: false; message: string; field?: string }

describe('admin leads route', () => {
  beforeEach(async () => {
    await createIsolatedApp()
  })

  afterEach(() => {
    teardown()
  })

  it('GET /api/admin/leads returns 401 without cookie', async () => {
    const r = await request(app, { method: 'GET', path: '/api/admin/leads' })
    expect(r.status).toBe(401)
    expect(r.json<{ success: boolean }>().success).toBe(false)
  })

  it('authed GET returns all rows ordered created_at DESC', async () => {
    const token = await loginAndGetCookie()
    const r = await authedGet('/api/admin/leads', token)
    expect(r.status).toBe(200)
    const body = r.json<LeadsBody>()
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(SEED_LEADS.length)
    const created = body.data.map(row => row.created_at)
    const sortedDesc = [...created].sort().reverse()
    expect(created).toEqual(sortedDesc)
  })

  it('?locale=pt-BR returns only PT-BR rows', async () => {
    const token = await loginAndGetCookie()
    const r = await authedGet('/api/admin/leads?locale=pt-BR', token)
    expect(r.status).toBe(200)
    const body = r.json<LeadsBody>()
    expect(body.data.length).toBeGreaterThan(0)
    for (const row of body.data) {
      expect(row.locale).toBe<Locale>('pt-BR')
    }
  })

  it('?status=pending returns only pending rows', async () => {
    const token = await loginAndGetCookie()
    const r = await authedGet('/api/admin/leads?status=pending', token)
    expect(r.status).toBe(200)
    const body = r.json<LeadsBody>()
    expect(body.data.length).toBeGreaterThan(0)
    for (const row of body.data) {
      expect(row.status).toBe<LeadStatus>('pending')
    }
  })

  it('?locale=pt-BR&status=pending returns the intersection', async () => {
    const token = await loginAndGetCookie()
    const r = await authedGet('/api/admin/leads?locale=pt-BR&status=pending', token)
    expect(r.status).toBe(200)
    const body = r.json<LeadsBody>()
    expect(body.data.length).toBeGreaterThan(0)
    for (const row of body.data) {
      expect(row.locale).toBe<Locale>('pt-BR')
      expect(row.status).toBe<LeadStatus>('pending')
    }
  })

  it('?locale=zz returns 400 with field: locale', async () => {
    const token = await loginAndGetCookie()
    const r = await authedGet('/api/admin/leads?locale=zz', token)
    expect(r.status).toBe(400)
    const body = r.json<ErrBody>()
    expect(body.success).toBe(false)
    expect(body.field).toBe('locale')
  })

  it('?status=banana returns 400 with field: status', async () => {
    const token = await loginAndGetCookie()
    const r = await authedGet('/api/admin/leads?status=banana', token)
    expect(r.status).toBe(400)
    const body = r.json<ErrBody>()
    expect(body.success).toBe(false)
    expect(body.field).toBe('status')
  })

  it('unknown query keys are silently ignored', async () => {
    const token = await loginAndGetCookie()
    const r = await authedGet('/api/admin/leads?limit=1&offset=0&foo=bar', token)
    expect(r.status).toBe(200)
    const body = r.json<LeadsBody>()
    expect(body.data).toHaveLength(SEED_LEADS.length)
  })
})

describe('PATCH /api/admin/leads/:id/status', () => {
  beforeEach(async () => {
    await createIsolatedApp()
  })

  afterEach(() => {
    teardown()
  })

  function getFirstSeededLead(): DemoRequestRow {
    const rows = leadsDao.list()
    if (rows.length === 0) throw new Error('seed data missing')
    return rows[0]
  }

  it('returns 401 without cookie', async () => {
    const target = getFirstSeededLead()
    const r = await request(app, {
      method: 'PATCH',
      path: `/api/admin/leads/${target.id}/status`,
      body: { status: 'contacted' },
    })
    expect(r.status).toBe(401)
    expect(r.json<{ success: boolean }>().success).toBe(false)
  })

  it('200 updates status; DB reflects new value', async () => {
    const token = await loginAndGetCookie()
    const target = getFirstSeededLead()
    const r = await authedPatch(`/api/admin/leads/${target.id}/status`, token, {
      status: 'contacted',
    })
    expect(r.status).toBe(200)
    const body = r.json<LeadBody>()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe(target.id)
    expect(body.data.status).toBe<LeadStatus>('contacted')
    expect(typeof body.data.updated_at).toBe('string')
    const persisted = leadsDao.getById(target.id)
    expect(persisted?.status).toBe<LeadStatus>('contacted')
  })

  it('returns 400 on invalid status with field: status', async () => {
    const token = await loginAndGetCookie()
    const target = getFirstSeededLead()
    const before = target.status
    const r = await authedPatch(`/api/admin/leads/${target.id}/status`, token, {
      status: 'archived',
    })
    expect(r.status).toBe(400)
    const body = r.json<ErrBody>()
    expect(body.success).toBe(false)
    expect(body.field).toBe('status')
    expect(leadsDao.getById(target.id)?.status).toBe(before)
  })

  it('returns 400 on missing status with field: status', async () => {
    const token = await loginAndGetCookie()
    const target = getFirstSeededLead()
    const before = target.status
    const r = await authedPatch(`/api/admin/leads/${target.id}/status`, token, {})
    expect(r.status).toBe(400)
    const body = r.json<ErrBody>()
    expect(body.field).toBe('status')
    expect(leadsDao.getById(target.id)?.status).toBe(before)
  })

  it('returns 400 on non-numeric :id with field: id', async () => {
    const token = await loginAndGetCookie()
    const r = await authedPatch('/api/admin/leads/abc/status', token, {
      status: 'contacted',
    })
    expect(r.status).toBe(400)
    const body = r.json<ErrBody>()
    expect(body.field).toBe('id')
    expect(body.message).toBe('Invalid lead id')
  })

  it('returns 400 on negative :id with field: id', async () => {
    const token = await loginAndGetCookie()
    const r = await authedPatch('/api/admin/leads/-1/status', token, {
      status: 'contacted',
    })
    expect(r.status).toBe(400)
    const body = r.json<ErrBody>()
    expect(body.field).toBe('id')
  })

  it('returns 404 on unknown id with valid body', async () => {
    const token = await loginAndGetCookie()
    const r = await authedPatch('/api/admin/leads/999999/status', token, {
      status: 'qualified',
    })
    expect(r.status).toBe(404)
    const body = r.json<ErrBody>()
    expect(body.success).toBe(false)
    expect(body.message).toBe('Lead not found')
  })

  it('silently ignores unknown body keys', async () => {
    const token = await loginAndGetCookie()
    const target = getFirstSeededLead()
    const r = await authedPatch(`/api/admin/leads/${target.id}/status`, token, {
      status: 'qualified',
      foo: 'bar',
    })
    expect(r.status).toBe(200)
    const body = r.json<LeadBody>()
    expect(body.data.status).toBe<LeadStatus>('qualified')
    expect(leadsDao.getById(target.id)?.status).toBe<LeadStatus>('qualified')
  })

  it('updated_at moves forward (or stays a valid ISO date if SQLite resolution masks it)', async () => {
    const token = await loginAndGetCookie()
    const target = getFirstSeededLead()
    const beforeUpdatedAt = target.updated_at
    await new Promise(resolve => setTimeout(resolve, 1100))
    const r = await authedPatch(`/api/admin/leads/${target.id}/status`, token, {
      status: 'contacted',
    })
    expect(r.status).toBe(200)
    const body = r.json<LeadBody>()
    const afterUpdatedAt = body.data.updated_at
    expect(typeof afterUpdatedAt).toBe('string')
    expect(Number.isNaN(Date.parse(afterUpdatedAt))).toBe(false)
    expect(Date.parse(afterUpdatedAt)).toBeGreaterThanOrEqual(Date.parse(beforeUpdatedAt))
  })
})
