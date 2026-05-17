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
let attemptsDaoModule: typeof import('../../dao/admin-login-attempts.dao') | undefined

async function createIsolatedApp(opts: { reuseDbPath?: string; seedAdmin?: boolean } = {}) {
  vi.resetModules()
  if (opts.reuseDbPath) {
    process.env.DB_PATH = opts.reuseDbPath
  } else {
    currentTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrev-admin-auth-db-'))
    process.env.DB_PATH = path.join(currentTempDir, 'test.db')
  }
  process.env.ALLOWED_ORIGIN = 'http://localhost:5173'
  process.env.JWT_SECRET = 'test-secret'

  const [{ createApp }, dbModule, daoModule, attemptsModule] = await Promise.all([
    import('../../index'),
    import('../../db'),
    import('../../dao/admin.dao'),
    import('../../dao/admin-login-attempts.dao'),
  ])
  currentDb = dbModule.default
  attemptsDaoModule = attemptsModule
  if (opts.seedAdmin !== false) {
    const existing = daoModule.adminDao.findByEmail('admin@example.com')
    if (!existing) {
      daoModule.adminDao.create({
        email: 'admin@example.com',
        password_hash: bcrypt.hashSync(PLAINTEXT, 12),
      })
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

  // Story 4.7 — admin login throttling & lockout
  describe('throttling and lockout (Story 4.7)', () => {
    it('returns 429 on 6th attempt from same IP within window', async () => {
      for (let i = 0; i < 5; i++) {
        const r = await request(app, {
          method: 'POST',
          path: '/api/admin/auth/login',
          body: { email: 'admin@example.com', password: 'wrong' },
          remoteAddress: '10.0.0.1',
        })
        expect(r.status).toBe(401)
      }
      const r6 = await request(app, {
        method: 'POST',
        path: '/api/admin/auth/login',
        body: { email: 'admin@example.com', password: 'wrong' },
        remoteAddress: '10.0.0.1',
      })
      expect(r6.status).toBe(429)
      expect(r6.json()).toEqual({ success: false, message: 'Too many requests' })
      expect(r6.headers['set-cookie']).toBeUndefined()
    })

    it('returns 401 (Invalid credentials, not Account locked) on 6th email-bound attempt across IPs', async () => {
      for (let i = 0; i < 5; i++) {
        const r = await request(app, {
          method: 'POST',
          path: '/api/admin/auth/login',
          body: { email: 'admin@example.com', password: 'wrong' },
          remoteAddress: `10.0.1.${i + 1}`,
        })
        expect(r.status).toBe(401)
      }
      const r6 = await request(app, {
        method: 'POST',
        path: '/api/admin/auth/login',
        body: { email: 'admin@example.com', password: 'wrong' },
        remoteAddress: '10.0.1.99',
      })
      expect(r6.status).toBe(401)
      expect(r6.json<{ message: string }>().message).toBe('Invalid credentials')
      expect(r6.headers['set-cookie']).toBeUndefined()
    })

    it('returns 401 when correct password is submitted during active lockout', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app, {
          method: 'POST',
          path: '/api/admin/auth/login',
          body: { email: 'admin@example.com', password: 'wrong' },
          remoteAddress: `10.0.2.${i + 1}`,
        })
      }
      const r = await request(app, {
        method: 'POST',
        path: '/api/admin/auth/login',
        body: { email: 'admin@example.com', password: PLAINTEXT },
        remoteAddress: '10.0.2.99',
      })
      expect(r.status).toBe(401)
      expect(r.json<{ message: string }>().message).toBe('Invalid credentials')
      expect(r.headers['set-cookie']).toBeUndefined()
    })

    it('grants 200 + cookie + resets counter when correct password arrives after window elapses', async () => {
      expect(attemptsDaoModule).toBeTruthy()
      const sixteenMinAgo = new Date(Date.now() - 16 * 60 * 1000)
      for (let i = 0; i < 5; i++) {
        attemptsDaoModule!.adminLoginAttemptsDao.recordFailure('admin@example.com', sixteenMinAgo)
      }
      const r = await request(app, {
        method: 'POST',
        path: '/api/admin/auth/login',
        body: { email: 'admin@example.com', password: PLAINTEXT },
        remoteAddress: '10.0.3.1',
      })
      expect(r.status).toBe(200)
      const token = extractCookieValue(r.headers['set-cookie'] as string | string[] | undefined, AUTH_COOKIE_NAME)
      expect(token).toBeTruthy()
      expect(attemptsDaoModule!.adminLoginAttemptsDao.getByEmail('admin@example.com')).toBeUndefined()
    })

    it('starts a fresh email failure window after the previous lockout expires', async () => {
      expect(attemptsDaoModule).toBeTruthy()
      const sixteenMinAgo = new Date(Date.now() - 16 * 60 * 1000)
      for (let i = 0; i < 5; i++) {
        attemptsDaoModule!.adminLoginAttemptsDao.recordFailure('admin@example.com', sixteenMinAgo)
      }
      const wrong = await request(app, {
        method: 'POST',
        path: '/api/admin/auth/login',
        body: { email: 'admin@example.com', password: 'wrong' },
        remoteAddress: '10.0.6.1',
      })
      expect(wrong.status).toBe(401)
      expect(attemptsDaoModule!.adminLoginAttemptsDao.getByEmail('admin@example.com')?.failed_count).toBe(1)

      const ok = await request(app, {
        method: 'POST',
        path: '/api/admin/auth/login',
        body: { email: 'admin@example.com', password: PLAINTEXT },
        remoteAddress: '10.0.6.2',
      })
      expect(ok.status).toBe(200)
    })

    it('does not throttle repeated successful logins from the same IP', async () => {
      for (let i = 0; i < 6; i++) {
        const r = await request(app, {
          method: 'POST',
          path: '/api/admin/auth/login',
          body: { email: 'admin@example.com', password: PLAINTEXT },
          remoteAddress: '10.0.7.1',
        })
        expect(r.status).toBe(200)
      }
    })

    it('resets counter after partial failures followed by a successful login', async () => {
      for (let i = 0; i < 3; i++) {
        await request(app, {
          method: 'POST',
          path: '/api/admin/auth/login',
          body: { email: 'admin@example.com', password: 'wrong' },
          remoteAddress: `10.0.4.${i + 1}`,
        })
      }
      expect(attemptsDaoModule!.adminLoginAttemptsDao.getByEmail('admin@example.com')?.failed_count).toBe(3)
      const ok = await request(app, {
        method: 'POST',
        path: '/api/admin/auth/login',
        body: { email: 'admin@example.com', password: PLAINTEXT },
        remoteAddress: '10.0.4.99',
      })
      expect(ok.status).toBe(200)
      expect(attemptsDaoModule!.adminLoginAttemptsDao.getByEmail('admin@example.com')).toBeUndefined()
    })

    it('failure counter persists across server restart (createApp re-creation)', async () => {
      const dbPath = process.env.DB_PATH!
      // Pre-populate 5 failures with a recent timestamp via the live DAO
      const recent = new Date()
      for (let i = 0; i < 5; i++) {
        attemptsDaoModule!.adminLoginAttemptsDao.recordFailure('admin@example.com', recent)
      }
      // Simulate restart: close current db handle and rebuild app against same file
      currentDb?.close()
      await createIsolatedApp({ reuseDbPath: dbPath })
      const r = await request(app, {
        method: 'POST',
        path: '/api/admin/auth/login',
        body: { email: 'admin@example.com', password: PLAINTEXT },
        remoteAddress: '10.0.5.1',
      })
      expect(r.status).toBe(401)
      expect(r.json<{ message: string }>().message).toBe('Invalid credentials')
      expect(r.headers['set-cookie']).toBeUndefined()
    })
  })
})
