// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import path from 'path'
import os from 'os'
import fs from 'fs'
import type { Express } from 'express'
import jwt from 'jsonwebtoken'
import { request } from './test-utils/request'
import { AUTH_COOKIE_NAME } from './middleware/auth'
import { FORM_RATE_LIMIT_MAX } from './middleware/rateLimit'

const tempDbDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrev-db-'))
const tempDbPath = path.join(tempDbDir, 'test.db')
process.env.DB_PATH = tempDbPath
process.env.ALLOWED_ORIGIN = 'http://localhost:5173'
process.env.JWT_SECRET = 'test-secret'

let app: Express

function expectSecurityHeaders(r: Awaited<ReturnType<typeof request>>) {
  expect(r.headers['content-security-policy']).toBeTruthy()
  expect(r.headers['x-content-type-options']).toBe('nosniff')
  expect(r.headers['x-frame-options']).toBeTruthy()
  expect(r.headers['referrer-policy']).toBeTruthy()
  expect(r.headers['x-powered-by']).toBeUndefined()
}

function expectAllowedCorsOrigin(r: Awaited<ReturnType<typeof request>>) {
  const acao = r.headers['access-control-allow-origin']
  expect(acao).toBe('http://localhost:5173')
  expect(acao).not.toBe('*')
}

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
    expect(r.json()).toMatchObject({ success: true, status: 'ok' })
    expect(typeof (r.json() as { timestamp: unknown }).timestamp).toBe('string')
  })

  it('applies Helmet default security headers', async () => {
    const r = await request(app, { path: '/api/health' })
    expectSecurityHeaders(r)
    expect(r.headers['x-dns-prefetch-control']).toBeTruthy()
  })

  it('CORS Access-Control-Allow-Origin matches ALLOWED_ORIGIN, never wildcard', async () => {
    const r = await request(app, {
      path: '/api/health',
      headers: { Origin: 'http://localhost:5173' },
    })
    expectAllowedCorsOrigin(r)
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

  it('mounts /api/demo with validation envelope', async () => {
    const r = await request(app, {
      method: 'POST',
      path: '/api/demo',
      headers: { 'content-type': 'application/json', Origin: 'http://localhost:5173' },
      body: {},
      remoteAddress: '127.0.4.1',
    })
    expect(r.status).toBe(400)
    expectSecurityHeaders(r)
    expectAllowedCorsOrigin(r)
    expect(r.json()).toEqual({
      success: false,
      message: 'Invalid demo request',
      field: expect.any(String),
    })
  })

  it('mounts /api/contact with validation envelope', async () => {
    const r = await request(app, {
      method: 'POST',
      path: '/api/contact',
      headers: { 'content-type': 'application/json' },
      body: {},
    })
    expect(r.status).toBe(400)
    expect(r.json()).toEqual({
      success: false,
      message: 'Invalid contact request',
      field: expect.any(String),
    })
  })

  it('admin routes require auth (401 without cookie)', async () => {
    const r = await request(app, { path: '/api/admin/leads' })
    expect(r.status).toBe(401)
    const body = r.json()
    expect(body).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('admin auth login mount rejects empty payload with 400', async () => {
    const r = await request(app, {
      method: 'POST',
      path: '/api/admin/auth/login',
      headers: { 'content-type': 'application/json' },
      body: {},
    })
    expect(r.status).toBe(400)
  })

  it('admin auth /me requires and reads a valid admin cookie', async () => {
    const missing = await request(app, { path: '/api/admin/auth/me' })
    expect(missing.status).toBe(401)

    // Story 4.8: requireAdmin now loads admin_users by id and enforces a
    // tokenVersion match. Seed a real row and sign with its id + version.
    const { adminDao } = await import('./dao/admin.dao')
    const seeded =
      adminDao.findByEmail('me-bootstrap@example.com') ??
      adminDao.create({ email: 'me-bootstrap@example.com', password_hash: 'unused' })
    const token = jwt.sign(
      { adminId: seeded.id, email: seeded.email, tokenVersion: seeded.token_version },
      'test-secret',
      { expiresIn: '8h' }
    )
    const ok = await request(app, {
      path: '/api/admin/auth/me',
      headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
    })
    expect(ok.status).toBe(200)
    expect(ok.json()).toEqual({
      success: true,
      data: { adminId: seeded.id, email: 'me-bootstrap@example.com' },
    })
  })

  it('returns JSON envelope for unknown API routes', async () => {
    const r = await request(app, {
      path: '/api/missing',
      headers: { Origin: 'http://localhost:5173' },
    })
    expect(r.status).toBe(404)
    expectSecurityHeaders(r)
    expectAllowedCorsOrigin(r)
    expect(r.headers['content-type']).toContain('application/json')
    expect(r.json()).toEqual({ success: false, message: 'Not found' })
  })

  it('keeps Helmet and restricted CORS headers on rate-limit 429 responses', async () => {
    let r
    for (let i = 0; i < FORM_RATE_LIMIT_MAX + 1; i += 1) {
      r = await request(app, {
        method: 'POST',
        path: '/api/demo',
        headers: { 'content-type': 'application/json', Origin: 'http://localhost:5173' },
        body: {},
        remoteAddress: '127.0.4.2',
      })
    }

    expect(r?.status).toBe(429)
    expectSecurityHeaders(r!)
    expectAllowedCorsOrigin(r!)
    expect(r?.json()).toEqual({ success: false, message: 'Too many requests' })
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

// ---------------------------------------------------------------------------
// Story 5.2 — Domain Configuration & SSL/TLS
// ---------------------------------------------------------------------------

describe('Story 5.2 — HTTP→HTTPS redirect middleware', () => {
  // The module-level app is created in test/dev mode — redirect must NOT fire.
  it('does NOT redirect when NODE_ENV is test (default test env)', async () => {
    const r = await request(app, {
      path: '/api/health',
      headers: { 'x-forwarded-proto': 'http' },
    })
    // Should return normal 200 — not a 301
    expect(r.status).toBe(200)
  })

  describe('production mode', () => {
    let prodApp: import('express').Express
    let savedEnv: string | undefined

    beforeAll(async () => {
      savedEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      vi.resetModules()
      const { createApp } = await import('./index')
      prodApp = createApp()
    })

    afterAll(() => {
      process.env.NODE_ENV = savedEnv
      vi.resetModules()
    })

    it('redirects 301 to HTTPS when X-Forwarded-Proto is http', async () => {
      const r = await request(prodApp, {
        path: '/api/health',
        headers: {
          'x-forwarded-proto': 'http',
          host: 'syncsirius.com',
        },
      })
      expect(r.status).toBe(301)
      expect(r.headers['location']).toBe('https://syncsirius.com/api/health')
    })

    it('redirects 301 when the first X-Forwarded-Proto value is http', async () => {
      const r = await request(prodApp, {
        path: '/api/health',
        headers: {
          'x-forwarded-proto': 'http, https',
          host: 'syncsirius.com',
        },
      })
      expect(r.status).toBe(301)
      expect(r.headers['location']).toBe('https://syncsirius.com/api/health')
    })

    it('does NOT redirect when X-Forwarded-Proto is https (already secure)', async () => {
      const r = await request(prodApp, {
        path: '/api/health',
        headers: { 'x-forwarded-proto': 'https' },
      })
      expect(r.status).toBe(200)
    })

    it('does NOT redirect when X-Forwarded-Proto header is absent', async () => {
      const r = await request(prodApp, { path: '/api/health' })
      expect(r.status).toBe(200)
    })

    it('sets Strict-Transport-Security header with maxAge=31536000 in production', async () => {
      const r = await request(prodApp, {
        path: '/api/health',
        headers: { 'x-forwarded-proto': 'https' },
      })
      const hsts = r.headers['strict-transport-security'] as string | undefined
      expect(hsts).toBeTruthy()
      expect(hsts).toContain('max-age=31536000')
      expect(hsts).toContain('includeSubDomains')
      expect(hsts).toContain('preload')
    })

    // -------------------------------------------------------------------
    // Story 5.9 — Express Trust Proxy Configuration
    // -------------------------------------------------------------------

    it('AC 1: enables trust proxy with value 1 in production', () => {
      // express stores numeric trust-proxy setting under `trust proxy` and a
      // resolved function under `trust proxy fn`. Setting the value to `1`
      // tells express to trust the first hop in the X-Forwarded-For chain.
      expect(prodApp.get('trust proxy')).toBe(1)
    })

    it('AC 2: req.protocol === "https" when X-Forwarded-Proto is https (with trust proxy)', async () => {
      // Build an isolated express app that mirrors the production bootstrap
      // block in `createApp` (trust proxy + redirect middleware) and mount a
      // probe route. The probe observes req.protocol/req.secure/req.ip after
      // express resolves X-Forwarded-* with `trust proxy 1`.
      //
      // We use an isolated app (instead of mutating `prodApp`) because the
      // production `createApp` also installs an SPA fallback route that
      // captures any non-`/api` path. AC 1 above already verifies the actual
      // `prodApp.get('trust proxy')` value to prove the production createApp
      // path enables the setting.
      const expressModule = await import('express')
      const probeApp = expressModule.default()
      probeApp.set('trust proxy', 1)
      probeApp.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] === 'http') {
          return res.redirect(301, `https://${req.headers.host}${req.url}`)
        }
        next()
      })
      probeApp.get('/__probe', (req, res) => {
        res.status(200).json({
          protocol: req.protocol,
          secure: req.secure,
          ip: req.ip,
        })
      })

      const r = await request(probeApp, {
        path: '/__probe',
        headers: {
          'x-forwarded-proto': 'https',
          'x-forwarded-for': '203.0.113.7',
        },
      })
      expect(r.status).toBe(200)
      const body = r.json<{ protocol: string; secure: boolean; ip: string }>()
      expect(body.protocol).toBe('https')
      expect(body.secure).toBe(true)
      // With trust proxy 1, req.ip should resolve from X-Forwarded-For[0]
      // rather than the socket remoteAddress (127.0.0.1 in the test harness).
      expect(body.ip).toBe('203.0.113.7')
    })

    it('AC 2: req.protocol === "http" before redirect when X-Forwarded-Proto is http', async () => {
      const expressModule = await import('express')
      const probeApp = expressModule.default()
      let observedProtocol: string | undefined

      probeApp.set('trust proxy', 1)
      probeApp.use((req, res, next) => {
        observedProtocol = req.protocol
        const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase()
        if (forwardedProto === 'http') {
          return res.redirect(301, `https://${req.headers.host}${req.url}`)
        }
        next()
      })
      probeApp.get('/__probe', (_req, res) => {
        res.status(200).json({ ok: true })
      })

      const r = await request(probeApp, {
        path: '/__probe',
        headers: {
          'x-forwarded-proto': 'http',
          host: 'syncsirius.com',
        },
      })
      expect(r.status).toBe(301)
      expect(r.headers['location']).toBe('https://syncsirius.com/__probe')
      expect(observedProtocol).toBe('http')
    })
  })

  it('AC 1: trust proxy is NOT enabled in test/dev environment', () => {
    // The module-level `app` is created with NODE_ENV=test. Express default
    // when `trust proxy` is unset is `false`.
    expect(app.get('trust proxy')).toBe(false)
  })

  it('does NOT set Strict-Transport-Security header in test/dev environment', async () => {
    // The module-level `app` is created with NODE_ENV=test — HSTS must be absent.
    const r = await request(app, { path: '/api/health' })
    const hsts = r.headers['strict-transport-security']
    expect(hsts).toBeUndefined()
  })
})

describe('Story 5.2 — CORS origin restriction (AC 3)', () => {
  // The module-level app uses ALLOWED_ORIGIN='http://localhost:5173'

  it('Access-Control-Allow-Origin matches ALLOWED_ORIGIN exactly, not wildcard', async () => {
    const r = await request(app, {
      path: '/api/health',
      headers: { Origin: 'http://localhost:5173' },
    })
    const acao = r.headers['access-control-allow-origin']
    expect(acao).toBe('http://localhost:5173')
    expect(acao).not.toBe('*')
  })

  it('wildcard is never returned even for unmatched origins', async () => {
    const r = await request(app, {
      path: '/api/health',
      headers: { Origin: 'https://attacker.example.com' },
    })
    expect(r.headers['access-control-allow-origin']).not.toBe('*')
  })

  it('CORS preflight OPTIONS returns correct Access-Control-Allow-Origin', async () => {
    const r = await request(app, {
      method: 'OPTIONS',
      path: '/api/health',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
    })
    // Preflight returns 204 or 200; ACAO must match ALLOWED_ORIGIN, not *
    expect([200, 204]).toContain(r.status)
    const acao = r.headers['access-control-allow-origin']
    expect(acao).toBe('http://localhost:5173')
    expect(acao).not.toBe('*')
  })

  it('CORS preflight with production origin returns that exact origin', async () => {
    // Simulate ALLOWED_ORIGIN='https://syncsirius.com' (production scenario)
    const savedEnv = process.env.ALLOWED_ORIGIN
    process.env.ALLOWED_ORIGIN = 'https://syncsirius.com'
    vi.resetModules()
    try {
      const { createApp } = await import('./index')
      const prodCorsApp = createApp()

      const r = await request(prodCorsApp, {
        method: 'OPTIONS',
        path: '/api/health',
        headers: {
          Origin: 'https://syncsirius.com',
          'Access-Control-Request-Method': 'GET',
        },
      })

      const acao = r.headers['access-control-allow-origin']
      expect(acao).toBe('https://syncsirius.com')
      expect(acao).not.toBe('*')
    } finally {
      process.env.ALLOWED_ORIGIN = savedEnv
      vi.resetModules()
    }
  })
})

describe('staticCacheHeaders (AC 5: Cache-Control for production static assets)', () => {
  const makeRes = () => ({
    setHeader: vi.fn(),
  })

  it('sets no-cache on index.html (Cache-Control + HTTP/1.0 Pragma/Expires)', async () => {
    const { staticCacheHeaders } = await import('./index')
    const res = makeRes()
    staticCacheHeaders(res as unknown as import('express').Response, '/dist/client/index.html')
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-cache, no-store, must-revalidate'
    )
    expect(res.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache')
    expect(res.setHeader).toHaveBeenCalledWith('Expires', '0')
  })

  it('sets immutable long-lived cache on a Vite-hashed JS asset', async () => {
    const { staticCacheHeaders } = await import('./index')
    const res = makeRes()
    staticCacheHeaders(
      res as unknown as import('express').Response,
      '/dist/client/assets/index-G46mRFNK.js'
    )
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'max-age=31536000, immutable'
    )
  })

  it('sets immutable long-lived cache on a Vite-hashed CSS asset', async () => {
    const { staticCacheHeaders } = await import('./index')
    const res = makeRes()
    staticCacheHeaders(
      res as unknown as import('express').Response,
      '/dist/client/assets/index-CpMBkvzi.css'
    )
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'max-age=31536000, immutable'
    )
  })

  it('sets immutable long-lived cache on a Vite-hashed WebP image', async () => {
    const { staticCacheHeaders } = await import('./index')
    const res = makeRes()
    staticCacheHeaders(
      res as unknown as import('express').Response,
      '/dist/client/assets/hero-mobile-abc12345.webp'
    )
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'max-age=31536000, immutable'
    )
  })

  it('sets no Cache-Control header for an unhashed static file (e.g. og-default.png)', async () => {
    const { staticCacheHeaders } = await import('./index')
    const res = makeRes()
    staticCacheHeaders(
      res as unknown as import('express').Response,
      '/dist/client/og-default.png'
    )
    // Neither rule matches — setHeader should NOT be called
    expect(res.setHeader).not.toHaveBeenCalled()
  })

  it('sets no Cache-Control header for robots.txt (no hash segment)', async () => {
    const { staticCacheHeaders } = await import('./index')
    const res = makeRes()
    staticCacheHeaders(
      res as unknown as import('express').Response,
      '/dist/client/robots.txt'
    )
    expect(res.setHeader).not.toHaveBeenCalled()
  })
})
