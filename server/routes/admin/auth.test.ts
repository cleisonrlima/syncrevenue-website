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

const PLAINTEXT = 'correcthorsebatterystaple'

let app: Express
let currentDb: Database.Database | undefined
let currentTempDir: string | undefined

async function createIsolatedApp() {
  vi.resetModules()
  currentTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrev-admin-auth-db-'))
  process.env.DB_PATH = path.join(currentTempDir, 'test.db')
  process.env.ALLOWED_ORIGIN = 'http://localhost:5173'
  process.env.JWT_SECRET = 'test-secret'

  const [{ createApp }, dbModule, daoModule] = await Promise.all([
    import('../../index'),
    import('../../db'),
    import('../../dao/admin.dao'),
  ])
  currentDb = dbModule.default
  daoModule.adminDao.create({
    email: 'admin@example.com',
    password_hash: bcrypt.hashSync(PLAINTEXT, 12),
  })
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

describe('admin auth routes', () => {
  beforeEach(async () => {
    await createIsolatedApp()
  })

  afterEach(() => {
    teardown()
  })

  it('POST /login returns 200 + sets admin_token cookie on valid credentials', async () => {
    const r = await request(app, {
      method: 'POST',
      path: '/api/admin/auth/login',
      body: { email: 'admin@example.com', password: PLAINTEXT },
    })
    expect(r.status).toBe(200)
    const body = r.json<{ success: true; data: { adminId: number; email: string } }>()
    expect(body.success).toBe(true)
    expect(body.data.email).toBe('admin@example.com')
    const token = extractCookieValue(r.headers['set-cookie'] as string | string[] | undefined, AUTH_COOKIE_NAME)
    expect(token).toBeTruthy()
    const setCookieHeader = String(r.headers['set-cookie'])
    expect(setCookieHeader).toContain('HttpOnly')
    expect(setCookieHeader).toContain('SameSite=Strict')
  })

  it('POST /login returns 400 when password missing', async () => {
    const r = await request(app, {
      method: 'POST',
      path: '/api/admin/auth/login',
      body: { email: 'admin@example.com' },
    })
    expect(r.status).toBe(400)
    expect(r.json<{ success: boolean }>().success).toBe(false)
  })

  it('POST /login returns 400 when email malformed', async () => {
    const r = await request(app, {
      method: 'POST',
      path: '/api/admin/auth/login',
      body: { email: 'not-an-email', password: 'x' },
    })
    expect(r.status).toBe(400)
  })

  it('POST /login returns 401 + Invalid credentials on unknown email', async () => {
    const r = await request(app, {
      method: 'POST',
      path: '/api/admin/auth/login',
      body: { email: 'ghost@example.com', password: PLAINTEXT },
    })
    expect(r.status).toBe(401)
    expect(r.json<{ message: string }>().message).toBe('Invalid credentials')
    expect(r.headers['set-cookie']).toBeUndefined()
  })

  it('POST /login returns 401 + Invalid credentials on wrong password', async () => {
    const r = await request(app, {
      method: 'POST',
      path: '/api/admin/auth/login',
      body: { email: 'admin@example.com', password: 'wrong' },
    })
    expect(r.status).toBe(401)
    expect(r.json<{ message: string }>().message).toBe('Invalid credentials')
    expect(r.headers['set-cookie']).toBeUndefined()
  })

  it('POST /login returns 500 when JWT_SECRET missing', async () => {
    delete process.env.JWT_SECRET
    const r = await request(app, {
      method: 'POST',
      path: '/api/admin/auth/login',
      body: { email: 'admin@example.com', password: PLAINTEXT },
    })
    expect(r.status).toBe(500)
    expect(r.json<{ success: boolean }>().success).toBe(false)
  })

  it('POST /login returns 400 for invalid payload before JWT_SECRET config check', async () => {
    delete process.env.JWT_SECRET
    const r = await request(app, {
      method: 'POST',
      path: '/api/admin/auth/login',
      body: { email: 'not-an-email' },
    })
    expect(r.status).toBe(400)
    expect(r.json<{ success: boolean; field?: string }>()).toMatchObject({
      success: false,
      field: 'email',
    })
  })

  it('POST /logout returns 200 + clears cookie (idempotent without prior login)', async () => {
    const r = await request(app, {
      method: 'POST',
      path: '/api/admin/auth/logout',
    })
    expect(r.status).toBe(200)
    expect(r.json<{ success: boolean }>().success).toBe(true)
    const setCookieHeader = String(r.headers['set-cookie'])
    expect(setCookieHeader).toContain(`${AUTH_COOKIE_NAME}=`)
    expect(setCookieHeader).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/)
  })

  it('GET /me returns 401 without cookie', async () => {
    const r = await request(app, { method: 'GET', path: '/api/admin/auth/me' })
    expect(r.status).toBe(401)
  })

  it('GET /me returns 200 + session data after login cookie round-trip', async () => {
    const loginResponse = await request(app, {
      method: 'POST',
      path: '/api/admin/auth/login',
      body: { email: 'admin@example.com', password: PLAINTEXT },
    })
    const token = extractCookieValue(loginResponse.headers['set-cookie'] as string | string[] | undefined, AUTH_COOKIE_NAME)
    expect(token).toBeTruthy()

    const meResponse = await request(app, {
      method: 'GET',
      path: '/api/admin/auth/me',
      headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
    })
    expect(meResponse.status).toBe(200)
    const body = meResponse.json<{ data: { email: string } }>()
    expect(body.data.email).toBe('admin@example.com')
  })
})
