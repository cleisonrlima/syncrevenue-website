// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { AddressInfo } from 'net'
import type { Server } from 'http'
import path from 'path'
import os from 'os'
import fs from 'fs'

const tempDbDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrev-db-'))
const tempDbPath = path.join(tempDbDir, 'test.db')
process.env.DB_PATH = tempDbPath
process.env.ALLOWED_ORIGIN = 'http://localhost:5173'
process.env.JWT_SECRET = 'test-secret'

let server: Server
let baseUrl: string

beforeAll(async () => {
  const { createApp } = await import('./index')
  const app = createApp()
  server = app.listen(0)
  await new Promise<void>((resolve) => server.on('listening', () => resolve()))
  const { port } = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${port}`
})

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
  try {
    fs.rmSync(tempDbDir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
})

describe('Express bootstrap', () => {
  it('GET /api/health returns success envelope', async () => {
    const r = await fetch(`${baseUrl}/api/health`)
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ success: true, status: 'ok' })
  })

  it('applies Helmet default security headers', async () => {
    const r = await fetch(`${baseUrl}/api/health`)
    expect(r.headers.get('x-content-type-options')).toBe('nosniff')
    expect(r.headers.get('x-dns-prefetch-control')).toBeTruthy()
    expect(r.headers.get('x-powered-by')).toBeNull()
  })

  it('CORS Access-Control-Allow-Origin matches ALLOWED_ORIGIN, never wildcard', async () => {
    const r = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'http://localhost:5173' },
    })
    const acao = r.headers.get('access-control-allow-origin')
    expect(acao).toBe('http://localhost:5173')
    expect(acao).not.toBe('*')
  })

  it('CORS never returns wildcard, even for foreign origin', async () => {
    const r = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'http://evil.example.com' },
    })
    const acao = r.headers.get('access-control-allow-origin')
    expect(acao).not.toBe('*')
    if (acao !== null) expect(acao).toBe('http://localhost:5173')
  })

  it('mounts /api/demo (501 placeholder envelope)', async () => {
    const r = await fetch(`${baseUrl}/api/demo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    })
    expect(r.status).toBe(501)
    const body = await r.json()
    expect(body.success).toBe(false)
    expect(typeof body.message).toBe('string')
  })

  it('mounts /api/contact (501 placeholder envelope)', async () => {
    const r = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    })
    expect(r.status).toBe(501)
  })

  it('admin routes require auth (401 without cookie)', async () => {
    const r = await fetch(`${baseUrl}/api/admin/leads`)
    expect(r.status).toBe(401)
    const body = await r.json()
    expect(body).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('admin auth login mount returns 501 placeholder', async () => {
    const r = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    })
    expect(r.status).toBe(501)
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
