// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import path from 'path'
import os from 'os'
import fs from 'fs'
import type { Express } from 'express'
import jwt from 'jsonwebtoken'
import { request } from './test-utils/request'
import { AUTH_COOKIE_NAME } from './middleware/auth'

const tempDbDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrev-db-'))
const tempDbPath = path.join(tempDbDir, 'test.db')
process.env.DB_PATH = tempDbPath
process.env.ALLOWED_ORIGIN = 'http://localhost:5173'
process.env.JWT_SECRET = 'test-secret'

let app: Express

beforeAll(async () => {
  const { createApp } = await import('./index')
  app = createApp()
})

afterAll(async () => {
  try {
    fs.rmSync(tempDbDir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
})

describe('Express bootstrap', () => {
  it('GET /api/health returns success envelope', async () => {
    const r = await request(app, { path: '/api/health' })
    expect(r.status).toBe(200)
    expect(r.json()).toEqual({ success: true, status: 'ok' })
  })

  it('applies Helmet default security headers', async () => {
    const r = await request(app, { path: '/api/health' })
    expect(r.headers['x-content-type-options']).toBe('nosniff')
    expect(r.headers['x-dns-prefetch-control']).toBeTruthy()
    expect(r.headers['x-powered-by']).toBeUndefined()
  })

  it('CORS Access-Control-Allow-Origin matches ALLOWED_ORIGIN, never wildcard', async () => {
    const r = await request(app, {
      path: '/api/health',
      headers: { Origin: 'http://localhost:5173' },
    })
    const acao = r.headers['access-control-allow-origin']
    expect(acao).toBe('http://localhost:5173')
    expect(acao).not.toBe('*')
  })

  it('CORS never returns wildcard, even for foreign origin', async () => {
    const r = await request(app, {
      path: '/api/health',
      headers: { Origin: 'http://evil.example.com' },
    })
    const acao = r.headers['access-control-allow-origin']
    expect(acao).not.toBe('*')
    if (acao !== undefined) expect(acao).toBe('http://localhost:5173')
  })

  it('mounts /api/demo (501 placeholder envelope)', async () => {
    const r = await request(app, {
      method: 'POST',
      path: '/api/demo',
      headers: { 'content-type': 'application/json' },
      body: {},
    })
    expect(r.status).toBe(501)
    const body = r.json<{ success: boolean; message: string }>()
    expect(body.success).toBe(false)
    expect(typeof body.message).toBe('string')
  })

  it('mounts /api/contact (501 placeholder envelope)', async () => {
    const r = await request(app, {
      method: 'POST',
      path: '/api/contact',
      headers: { 'content-type': 'application/json' },
      body: {},
    })
    expect(r.status).toBe(501)
  })

  it('admin routes require auth (401 without cookie)', async () => {
    const r = await request(app, { path: '/api/admin/leads' })
    expect(r.status).toBe(401)
    const body = r.json()
    expect(body).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('admin auth login mount returns 501 placeholder', async () => {
    const r = await request(app, {
      method: 'POST',
      path: '/api/admin/auth/login',
      headers: { 'content-type': 'application/json' },
      body: {},
    })
    expect(r.status).toBe(501)
  })

  it('admin auth /me requires and reads a valid admin cookie', async () => {
    const missing = await request(app, { path: '/api/admin/auth/me' })
    expect(missing.status).toBe(401)

    const token = jwt.sign({ adminId: 7, email: 'admin@example.com' }, 'test-secret', {
      expiresIn: '8h',
    })
    const ok = await request(app, {
      path: '/api/admin/auth/me',
      headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
    })
    expect(ok.status).toBe(200)
    expect(ok.json()).toEqual({
      success: true,
      data: { adminId: 7, email: 'admin@example.com' },
    })
  })

  it('returns JSON envelope for unknown API routes', async () => {
    const r = await request(app, { path: '/api/missing' })
    expect(r.status).toBe(404)
    expect(r.headers['content-type']).toContain('application/json')
    expect(r.json()).toEqual({ success: false, message: 'Not found' })
  })

  it('returns JSON envelope for malformed API JSON', async () => {
    const r = await request(app, {
      method: 'POST',
      path: '/api/demo',
      headers: { 'content-type': 'application/json' },
      body: '{',
    })
    expect(r.status).toBe(400)
    expect(r.headers['content-type']).toContain('application/json')
    expect(r.json()).toEqual({ success: false, message: 'Invalid JSON payload' })
  })
})

describe('Client surface secrets check', () => {
  it('no VITE_ prefixed secret names in src/', async () => {
    const repoRoot = path.resolve(__dirname, '..')
    const srcDir = path.join(repoRoot, 'src')
    const offenders: string[] = []
    const FORBIDDEN = ['VITE_JWT_SECRET', 'VITE_SMTP', 'VITE_DB_PATH', 'VITE_NOTIFY']
    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          walk(p)
          continue
        }
        if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue
        const content = fs.readFileSync(p, 'utf8')
        for (const needle of FORBIDDEN) {
          if (content.includes(needle)) offenders.push(`${p}:${needle}`)
        }
      }
    }
    walk(srcDir)
    expect(offenders).toEqual([])
  })
})

describe('No raw SQL in route handlers', () => {
  it('server/routes/**/*.ts files do not call db.prepare', () => {
    const repoRoot = path.resolve(__dirname, '..')
    const routesDir = path.join(repoRoot, 'server', 'routes')
    const offenders: string[] = []
    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          walk(p)
          continue
        }
        if (!entry.name.endsWith('.ts')) continue
        if (entry.name.endsWith('.test.ts')) continue
        const content = fs.readFileSync(p, 'utf8')
        if (/db\.prepare\s*\(/.test(content)) offenders.push(p)
      }
    }
    walk(routesDir)
    expect(offenders).toEqual([])
  })
})

beforeEach(() => {
  /* per-test isolation hook reserved */
})
