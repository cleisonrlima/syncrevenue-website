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
import type { TeamMemberInput, TeamMemberRow } from '../../dao/team.dao'

const PLAINTEXT = 'correcthorsebatterystaple'
const ADMIN_EMAIL = 'admin@example.com'

let app: Express
let currentDb: Database.Database | undefined
let currentTempDir: string | undefined
let teamDao: typeof import('../../dao/team.dao').teamDao

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
  currentTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrev-admin-team-db-'))
  process.env.DB_PATH = path.join(currentTempDir, 'test.db')
  process.env.ALLOWED_ORIGIN = 'http://localhost:5173'
  process.env.JWT_SECRET = 'test-secret'

  const [{ createApp }, dbModule, adminDaoModule, teamDaoModule] = await Promise.all([
    import('../../index'),
    import('../../db'),
    import('../../dao/admin.dao'),
    import('../../dao/team.dao'),
  ])
  currentDb = dbModule.default
  adminDaoModule.adminDao.create({
    email: ADMIN_EMAIL,
    password_hash: bcrypt.hashSync(PLAINTEXT, 12),
  })
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

function extractCookieValue(setCookie: string | string[] | undefined, name: string) {
  if (!setCookie) return undefined
  const headers = Array.isArray(setCookie) ? setCookie : [setCookie]
  const match = headers.find((h) => h.startsWith(`${name}=`))
  if (!match) return undefined
  return match.split(';')[0].slice(name.length + 1)
}

async function loginAndGetCookie(): Promise<string> {
  const r = await request(app, {
    method: 'POST',
    path: '/api/admin/auth/login',
    body: { email: ADMIN_EMAIL, password: PLAINTEXT },
  })
  const token = extractCookieValue(
    r.headers['set-cookie'] as string | string[] | undefined,
    AUTH_COOKIE_NAME
  )
  if (!token) throw new Error('login did not return admin_token cookie')
  return token
}

async function authedPost(pathStr: string, token: string, body: Record<string, unknown>) {
  return request(app, {
    method: 'POST',
    path: pathStr,
    headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
    body,
  })
}

async function authedPut(pathStr: string, token: string, body: Record<string, unknown>) {
  return request(app, {
    method: 'PUT',
    path: pathStr,
    headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
    body,
  })
}

type RowBody = { success: true; data: TeamMemberRow }
type ErrBody = { success: false; message: string; field?: string }

describe('POST /api/admin/team', () => {
  beforeEach(async () => {
    await createIsolatedApp()
  })
  afterEach(() => {
    teardown()
  })

  it('401 without cookie', async () => {
    const r = await request(app, {
      method: 'POST',
      path: '/api/admin/team',
      body: baseInput as unknown as Record<string, unknown>,
    })
    expect(r.status).toBe(401)
  })

  it('201 creates a member with defaults active=1, linkedin=null, photo_url=null', async () => {
    const token = await loginAndGetCookie()
    const r = await authedPost('/api/admin/team', token, baseInput as unknown as Record<string, unknown>)
    expect(r.status).toBe(201)
    const body = r.json<RowBody>()
    expect(body.success).toBe(true)
    expect(body.data.id).toBeGreaterThan(0)
    expect(body.data.name).toBe(baseInput.name)
    expect(body.data.active).toBe(1)
    expect(body.data.linkedin).toBeNull()
    expect(body.data.photo_url).toBeNull()
    expect(body.data.order_index).toBe(0)
    const persisted = teamDao.getById(body.data.id)
    expect(persisted?.name).toBe(baseInput.name)
  })

  it('400 on missing name with field: name', async () => {
    const token = await loginAndGetCookie()
    const r = await authedPost('/api/admin/team', token, {
      ...baseInput,
      name: '',
    } as unknown as Record<string, unknown>)
    expect(r.status).toBe(400)
    const body = r.json<ErrBody>()
    expect(body.field).toBe('name')
  })

  it.each([
    'role_en',
    'role_pt',
    'role_es',
    'bio_en',
    'bio_pt',
    'bio_es',
  ] as const)('400 on missing required %s', async (field) => {
    const token = await loginAndGetCookie()
    const r = await authedPost('/api/admin/team', token, {
      ...baseInput,
      [field]: '',
    } as unknown as Record<string, unknown>)
    expect(r.status).toBe(400)
    expect(r.json<ErrBody>().field).toBe(field)
  })

  it('400 on invalid linkedin URL with field: linkedin', async () => {
    const token = await loginAndGetCookie()
    const r = await authedPost('/api/admin/team', token, {
      ...baseInput,
      linkedin: 'not a url',
    } as unknown as Record<string, unknown>)
    expect(r.status).toBe(400)
    expect(r.json<ErrBody>().field).toBe('linkedin')
  })

  it('400 on invalid photo_url with field: photo_url', async () => {
    const token = await loginAndGetCookie()
    const r = await authedPost('/api/admin/team', token, {
      ...baseInput,
      photo_url: 'broken',
    } as unknown as Record<string, unknown>)
    expect(r.status).toBe(400)
    expect(r.json<ErrBody>().field).toBe('photo_url')
  })

  it('empty-string linkedin accepted, stored as null', async () => {
    const token = await loginAndGetCookie()
    const r = await authedPost('/api/admin/team', token, {
      ...baseInput,
      linkedin: '',
    } as unknown as Record<string, unknown>)
    expect(r.status).toBe(201)
    expect(r.json<RowBody>().data.linkedin).toBeNull()
  })

  it('coerces string order_index "2" to number 2', async () => {
    const token = await loginAndGetCookie()
    const r = await authedPost('/api/admin/team', token, {
      ...baseInput,
      order_index: '2',
    } as unknown as Record<string, unknown>)
    expect(r.status).toBe(201)
    expect(r.json<RowBody>().data.order_index).toBe(2)
  })

  it('400 on negative order_index', async () => {
    const token = await loginAndGetCookie()
    const r = await authedPost('/api/admin/team', token, {
      ...baseInput,
      order_index: -1,
    } as unknown as Record<string, unknown>)
    expect(r.status).toBe(400)
    expect(r.json<ErrBody>().field).toBe('order_index')
  })

  it('active: 0 in body silently ignored; row stored active=1', async () => {
    const token = await loginAndGetCookie()
    const r = await authedPost('/api/admin/team', token, {
      ...baseInput,
      active: 0,
    } as unknown as Record<string, unknown>)
    expect(r.status).toBe(201)
    expect(r.json<RowBody>().data.active).toBe(1)
  })

  it('silently ignores unknown body keys', async () => {
    const token = await loginAndGetCookie()
    const r = await authedPost('/api/admin/team', token, {
      ...baseInput,
      extra: 'ignored',
    } as unknown as Record<string, unknown>)
    expect(r.status).toBe(201)
  })
})

describe('PUT /api/admin/team/:id', () => {
  beforeEach(async () => {
    await createIsolatedApp()
  })
  afterEach(() => {
    teardown()
  })

  it('401 without cookie', async () => {
    const seeded = teamDao.create(baseInput)
    const r = await request(app, {
      method: 'PUT',
      path: `/api/admin/team/${seeded.id}`,
      body: { ...baseInput, name: 'X' } as unknown as Record<string, unknown>,
    })
    expect(r.status).toBe(401)
  })

  it('200 updates with full body; DB durability', async () => {
    const token = await loginAndGetCookie()
    const seeded = teamDao.create(baseInput)
    const r = await authedPut(`/api/admin/team/${seeded.id}`, token, {
      ...baseInput,
      name: 'Updated',
      role_en: 'Updated EN',
      linkedin: 'https://www.linkedin.com/in/updated',
      photo_url: 'https://example.com/u.webp',
      order_index: 5,
    } as unknown as Record<string, unknown>)
    expect(r.status).toBe(200)
    const body = r.json<RowBody>()
    expect(body.data.name).toBe('Updated')
    expect(body.data.role_en).toBe('Updated EN')
    expect(body.data.linkedin).toBe('https://www.linkedin.com/in/updated')
    expect(body.data.order_index).toBe(5)
    const persisted = teamDao.getById(seeded.id)
    expect(persisted?.name).toBe('Updated')
  })

  it('400 on invalid :id with field: id', async () => {
    const token = await loginAndGetCookie()
    const r = await authedPut('/api/admin/team/abc', token, baseInput as unknown as Record<string, unknown>)
    expect(r.status).toBe(400)
    expect(r.json<ErrBody>().field).toBe('id')
  })

  it('404 on unknown :id', async () => {
    const token = await loginAndGetCookie()
    const r = await authedPut('/api/admin/team/999999', token, baseInput as unknown as Record<string, unknown>)
    expect(r.status).toBe(404)
    expect(r.json<ErrBody>().message).toBe('Team member not found')
  })

  it('400 on missing required field same as POST', async () => {
    const token = await loginAndGetCookie()
    const seeded = teamDao.create(baseInput)
    const r = await authedPut(`/api/admin/team/${seeded.id}`, token, {
      ...baseInput,
      bio_en: '',
    } as unknown as Record<string, unknown>)
    expect(r.status).toBe(400)
    expect(r.json<ErrBody>().field).toBe('bio_en')
  })

  it('active field in body is silently stripped (active column unchanged)', async () => {
    const token = await loginAndGetCookie()
    const seeded = teamDao.create({ ...baseInput, active: 1 })
    const r = await authedPut(`/api/admin/team/${seeded.id}`, token, {
      ...baseInput,
      active: 0,
    } as unknown as Record<string, unknown>)
    expect(r.status).toBe(200)
    expect(r.json<RowBody>().data.active).toBe(1)
    expect(teamDao.getById(seeded.id)?.active).toBe(1)
  })
})
