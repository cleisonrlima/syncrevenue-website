// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Express } from 'express'
import type Database from 'better-sqlite3'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { request } from './test-utils/request'
import { FORM_RATE_LIMIT_MAX } from './middleware/rateLimit'

let currentDb: Database.Database | undefined
let currentTempDir: string | undefined

async function createIsolatedApp(): Promise<Express> {
  vi.resetModules()

  currentTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrev-rate-limit-db-'))
  process.env.DB_PATH = path.join(currentTempDir, 'test.db')
  process.env.ALLOWED_ORIGIN = 'http://localhost:5173'
  process.env.JWT_SECRET = 'test-secret'

  const [{ createApp }, dbModule] = await Promise.all([import('./index'), import('./db')])
  currentDb = dbModule.default
  return createApp()
}

afterEach(() => {
  currentDb?.close()
  currentDb = undefined
  if (currentTempDir) {
    fs.rmSync(currentTempDir, { recursive: true, force: true })
    currentTempDir = undefined
  }
})

async function exhaustRoute(app: Express, route: '/api/demo' | '/api/contact', remoteAddress: string) {
  let response = await request(app, {
    method: 'POST',
    path: route,
    body: {},
    remoteAddress,
  })

  for (let i = 1; i < FORM_RATE_LIMIT_MAX + 1; i += 1) {
    response = await request(app, {
      method: 'POST',
      path: route,
      body: {},
      remoteAddress,
    })
  }

  return response
}

describe('mounted form route rate limiting', () => {
  it('returns JSON 429 on /api/demo after the default 20 request limit', async () => {
    const app = await createIsolatedApp()
    const response = await exhaustRoute(app, '/api/demo', '127.0.0.10')

    expect(response.status).toBe(429)
    expect(response.json()).toEqual({ success: false, message: expect.any(String) })
  })

  it('does not consume rate-limit quota for non-POST form route requests', async () => {
    const app = await createIsolatedApp()

    for (let i = 0; i < FORM_RATE_LIMIT_MAX + 2; i += 1) {
      const getResponse = await request(app, {
        method: 'GET',
        path: '/api/demo',
        remoteAddress: '127.0.0.12',
      })
      expect(getResponse.status).toBe(404)
    }

    const postResponse = await request(app, {
      method: 'POST',
      path: '/api/demo',
      body: {},
      remoteAddress: '127.0.0.12',
    })
    expect(postResponse.status).toBe(501)
  })

  it('returns JSON 429 on /api/contact after the default 20 request limit', async () => {
    const app = await createIsolatedApp()
    const response = await exhaustRoute(app, '/api/contact', '127.0.0.11')

    expect(response.status).toBe(429)
    expect(response.json()).toEqual({ success: false, message: expect.any(String) })
  })
})
