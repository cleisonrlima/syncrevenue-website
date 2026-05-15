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
  let response
  for (let i = 0; i < FORM_RATE_LIMIT_MAX; i += 1) {
    response = await request(app, {
      method: 'POST',
      path: route,
      body: route === '/api/demo' ? validDemoPayload(i) : validContactPayload(i),
      remoteAddress,
    })
    expect(response.status).toBe(201)
    expect(response.headers.ratelimit).toBeTruthy()
    expect(response.headers['ratelimit-policy']).toBeTruthy()
    expect(response.headers['x-ratelimit-limit']).toBeUndefined()
    expect(response.headers['x-ratelimit-remaining']).toBeUndefined()
    expect(response.headers['x-ratelimit-reset']).toBeUndefined()
  }

  return request(app, {
    method: 'POST',
    path: route,
    body: route === '/api/demo' ? validDemoPayload(FORM_RATE_LIMIT_MAX) : validContactPayload(FORM_RATE_LIMIT_MAX),
    remoteAddress,
  })
}

function validDemoPayload(index: number) {
  return {
    name: `Rate Demo ${index}`,
    email: `rate-demo-${index}@example.com`,
    company: `Example Travel ${index}`,
    phone: '+1 305 555 0100',
    role: 'Owner',
    gds: 'Sabre',
    message: 'We need help reconciling commissions.',
    locale: 'en',
  }
}

function validContactPayload(index: number) {
  return {
    name: `Rate Contact ${index}`,
    email: `rate-contact-${index}@example.com`,
    subject: 'BI/Data Analytics',
    message: 'We need analytics help for agency revenue reporting.',
    locale: 'pt-BR',
  }
}

describe('mounted form route rate limiting', () => {
  it('returns JSON 429 on /api/demo after the default 20 request limit', async () => {
    const app = await createIsolatedApp()
    const response = await exhaustRoute(app, '/api/demo', '127.0.0.10')

    expect(response.status).toBe(429)
    expect(response.json()).toEqual({ success: false, message: 'Too many requests' })
    expect(response.headers.ratelimit).toBeTruthy()
    expect(response.headers['ratelimit-policy']).toBeTruthy()
    expect(response.headers['x-ratelimit-limit']).toBeUndefined()
    expect(response.headers['x-ratelimit-remaining']).toBeUndefined()
    expect(response.headers['x-ratelimit-reset']).toBeUndefined()
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
    expect(postResponse.status).toBe(400)
  })

  it('returns JSON 429 on /api/contact after the default 20 request limit', async () => {
    const app = await createIsolatedApp()
    const response = await exhaustRoute(app, '/api/contact', '127.0.0.11')

    expect(response.status).toBe(429)
    expect(response.json()).toEqual({ success: false, message: 'Too many requests' })
  })

  it('exhausting demo quota does not block the same IP from contact', async () => {
    const app = await createIsolatedApp()
    const remoteAddress = '127.0.0.13'

    const blockedDemo = await exhaustRoute(app, '/api/demo', remoteAddress)
    expect(blockedDemo.status).toBe(429)

    const firstContact = await request(app, {
      method: 'POST',
      path: '/api/contact',
      body: validContactPayload(100),
      remoteAddress,
    })
    expect(firstContact.status).toBe(201)
  })

  it('exhausting contact quota does not block the same IP from demo', async () => {
    const app = await createIsolatedApp()
    const remoteAddress = '127.0.0.14'

    const blockedContact = await exhaustRoute(app, '/api/contact', remoteAddress)
    expect(blockedContact.status).toBe(429)

    const firstDemo = await request(app, {
      method: 'POST',
      path: '/api/demo',
      body: validDemoPayload(100),
      remoteAddress,
    })
    expect(firstDemo.status).toBe(201)
  })
})
