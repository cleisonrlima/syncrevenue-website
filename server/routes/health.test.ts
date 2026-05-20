// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Express } from 'express'
import type Database from 'better-sqlite3'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { request } from '../test-utils/request'

let app: Express
let currentDb: Database.Database | undefined
let currentTempDir: string | undefined

async function createIsolatedApp() {
  vi.resetModules()

  currentTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrev-health-route-db-'))
  process.env.DB_PATH = path.join(currentTempDir, 'test.db')
  process.env.ALLOWED_ORIGIN = 'http://localhost:5173'
  process.env.JWT_SECRET = 'test-secret-for-health-route-tests'

  const [{ createApp }, dbModule] = await Promise.all([import('../index'), import('../db')])
  currentDb = dbModule.default
  app = createApp()
}

beforeEach(async () => {
  await createIsolatedApp()
})

afterEach(() => {
  if (currentDb && typeof (currentDb as Database.Database).close === 'function') {
    currentDb.close()
  }
  currentDb = undefined
  if (currentTempDir) {
    fs.rmSync(currentTempDir, { recursive: true, force: true })
    currentTempDir = undefined
  }
})

describe('GET /api/health', () => {
  it('returns HTTP 200 with success, status ok, and an ISO timestamp when the DB is healthy', async () => {
    const before = Date.now()

    const response = await request(app, {
      method: 'GET',
      path: '/api/health',
    })

    const after = Date.now()

    expect(response.status).toBe(200)

    const body = response.json<{ success: boolean; status: string; timestamp: string }>()
    expect(body.success).toBe(true)
    expect(body.status).toBe('ok')

    // Verify timestamp is a valid ISO 8601 string
    const ts = new Date(body.timestamp).getTime()
    expect(Number.isNaN(ts)).toBe(false)
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after + 100)
  })

  it('does not require authentication — no auth header → still returns 200', async () => {
    const response = await request(app, {
      method: 'GET',
      path: '/api/health',
      // no Authorization header, no cookie
    })

    expect(response.status).toBe(200)
    const body = response.json<{ success: boolean; status: string }>()
    expect(body.success).toBe(true)
  })

  it('returns HTTP 503 with status db_unavailable and an ISO timestamp when the DB probe throws', async () => {
    // Mock healthDao.ping() to throw, simulating a DB failure
    vi.resetModules()

    vi.doMock('../dao/health.dao', () => ({
      healthDao: {
        ping: vi.fn(() => {
          throw new Error('SQLITE_IOERR: disk I/O error')
        }),
      },
      createHealthDao: vi.fn(),
    }))

    const { createApp: createAppWithMockedDao } = await import('../index')
    const appWithMockedDao = createAppWithMockedDao()

    const before = Date.now()

    const response = await request(appWithMockedDao, {
      method: 'GET',
      path: '/api/health',
    })

    const after = Date.now()

    expect(response.status).toBe(503)

    const body = response.json<{ success: boolean; status: string; timestamp: string }>()
    expect(body.success).toBe(false)
    expect(body.status).toBe('db_unavailable')

    // Verify timestamp is a valid ISO 8601 string
    const ts = new Date(body.timestamp).getTime()
    expect(Number.isNaN(ts)).toBe(false)
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after + 100)

    vi.doUnmock('../dao/health.dao')
  })

  it('completes well under 200ms for a healthy DB (synchronous SELECT 1)', async () => {
    const start = Date.now()

    const response = await request(app, {
      method: 'GET',
      path: '/api/health',
    })

    const elapsed = Date.now() - start

    expect(response.status).toBe(200)
    // Generous budget — synchronous SQLite SELECT 1 completes in microseconds;
    // 200ms budget per AC 1, tested with 150ms to leave margin for slow CI runners
    expect(elapsed).toBeLessThan(150)
  })
})
