// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Express } from 'express'
import type Database from 'better-sqlite3'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { request } from '../test-utils/request'

const sendNotificationMock = vi.fn()

vi.mock('../lib/mailer', () => ({
  sendNotification: sendNotificationMock,
}))

let app: Express
let currentDb: Database.Database | undefined
let currentTempDir: string | undefined

const validPayload = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  company: 'Example Travel',
  phone: '+1 305 555 0100',
  role: 'Owner',
  gds: 'Sabre',
  message: 'We need help reconciling commissions.',
  locale: 'en',
}

async function createIsolatedApp() {
  vi.resetModules()
  sendNotificationMock.mockReset()
  sendNotificationMock.mockResolvedValue(undefined)

  currentTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrev-demo-route-db-'))
  process.env.DB_PATH = path.join(currentTempDir, 'test.db')
  process.env.ALLOWED_ORIGIN = 'http://localhost:5173'
  process.env.JWT_SECRET = 'test-secret'

  const [{ createApp }, dbModule] = await Promise.all([import('../index'), import('../db')])
  currentDb = dbModule.default
  app = createApp()
}

function countDemoRequests(): { count: number } {
  return currentDb
    ?.prepare('SELECT COUNT(*) as count FROM demo_requests')
    .get() as { count: number }
}

function latestDemoRequest(): { created_at: string } {
  return currentDb
    ?.prepare('SELECT created_at FROM demo_requests ORDER BY id DESC LIMIT 1')
    .get() as { created_at: string }
}

function demoRows() {
  return currentDb?.prepare('SELECT * FROM demo_requests ORDER BY id ASC').all() as Array<{
    name: string
    email: string
    message: string | null
  }>
}

function demoTableExists(): boolean {
  const row = currentDb
    ?.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'demo_requests'")
    .get() as { name: string } | undefined
  return row?.name === 'demo_requests'
}

beforeEach(async () => {
  await createIsolatedApp()
})

afterEach(() => {
  currentDb?.close()
  currentDb = undefined
  if (currentTempDir) {
    fs.rmSync(currentTempDir, { recursive: true, force: true })
    currentTempDir = undefined
  }
})

describe('POST /api/demo', () => {
  it('inserts a valid demo request and sends the exact notification contract', async () => {
    const response = await request(app, {
      method: 'POST',
      path: '/api/demo',
      body: validPayload,
      remoteAddress: '127.0.2.1',
    })

    expect(response.status).toBe(201)
    expect(response.json()).toEqual({
      success: true,
      message: expect.any(String),
    })
    expect(countDemoRequests().count).toBe(1)
    expect(sendNotificationMock).toHaveBeenCalledTimes(1)
    expect(sendNotificationMock).toHaveBeenCalledWith(
      'New Demo Request — Example Travel',
      [
        'Name: Jane Smith',
        'Email: jane@example.com',
        'Company: Example Travel',
        'Phone: +1 305 555 0100',
        'Role: Owner',
        'GDS: Sabre',
        'Message: We need help reconciling commissions.',
        'Locale: en',
        `Timestamp: ${latestDemoRequest().created_at}`,
      ].join('\n')
    )
  })

  it('returns a 200 success envelope for duplicate email retry without inserting again', async () => {
    await request(app, {
      method: 'POST',
      path: '/api/demo',
      body: validPayload,
      remoteAddress: '127.0.2.2',
    })

    const duplicate = await request(app, {
      method: 'POST',
      path: '/api/demo',
      body: validPayload,
      remoteAddress: '127.0.2.3',
    })

    expect(duplicate.status).toBe(200)
    expect(duplicate.json()).toEqual({
      success: true,
      message: expect.any(String),
    })
    expect(countDemoRequests().count).toBe(1)
    expect(sendNotificationMock).toHaveBeenCalledTimes(1)
  })

  it('returns HTTP 400 with a field for validation failures', async () => {
    const response = await request(app, {
      method: 'POST',
      path: '/api/demo',
      body: { ...validPayload, email: 'not-an-email' },
      remoteAddress: '127.0.2.4',
    })

    expect(response.status).toBe(400)
    expect(response.json()).toEqual({
      success: false,
      message: 'Invalid demo request',
      field: 'email',
    })
    expect(countDemoRequests().count).toBe(0)
    expect(sendNotificationMock).not.toHaveBeenCalled()
  })

  it('enforces locale allowlist before insert', async () => {
    const response = await request(app, {
      method: 'POST',
      path: '/api/demo',
      body: { ...validPayload, locale: 'fr' },
      remoteAddress: '127.0.2.5',
    })

    expect(response.status).toBe(400)
    expect(response.json()).toEqual({
      success: false,
      message: 'Invalid demo request',
      field: 'locale',
    })
    expect(countDemoRequests().count).toBe(0)
  })

  it('stores SQL injection-shaped input literally without surfacing SQL errors', async () => {
    const malicious = "Robert'); DROP TABLE demo_requests;--"
    const response = await request(app, {
      method: 'POST',
      path: '/api/demo',
      body: {
        ...validPayload,
        name: malicious,
        email: 'robert.demo@example.com',
        message: malicious,
      },
      remoteAddress: '127.0.2.50',
    })

    expect(response.status).toBe(201)
    expect(response.body).not.toMatch(/SQLITE|syntax error|DROP TABLE/i)
    expect(demoTableExists()).toBe(true)
    expect(demoRows()).toMatchObject([
      {
        name: malicious,
        email: 'robert.demo@example.com',
        message: malicious,
      },
    ])

    const followUp = await request(app, {
      method: 'POST',
      path: '/api/demo',
      body: { ...validPayload, email: 'after-injection-demo@example.com' },
      remoteAddress: '127.0.2.51',
    })
    expect(followUp.status).toBe(201)
    expect(countDemoRequests().count).toBe(2)
  })

  it('does not let notification failure block the database success response', async () => {
    sendNotificationMock.mockRejectedValueOnce(new Error('SMTP unavailable'))

    const response = await request(app, {
      method: 'POST',
      path: '/api/demo',
      body: validPayload,
      remoteAddress: '127.0.2.6',
    })

    expect(response.status).toBe(201)
    expect(response.json()).toEqual({
      success: true,
      message: expect.any(String),
    })
    expect(countDemoRequests().count).toBe(1)
  })

  it('returns before notification delivery resolves', async () => {
    sendNotificationMock.mockReturnValueOnce(new Promise(() => undefined))

    const response = await request(app, {
      method: 'POST',
      path: '/api/demo',
      body: validPayload,
      remoteAddress: '127.0.2.7',
    })

    expect(response.status).toBe(201)
    expect(countDemoRequests().count).toBe(1)
    expect(sendNotificationMock).toHaveBeenCalledTimes(1)
  })

  describe('Story 6.10 — GDS enum reconciliation', () => {
    it('accepts the merged Travelport (Galileo/Worldspan) label', async () => {
      const response = await request(app, {
        method: 'POST',
        path: '/api/demo',
        body: { ...validPayload, gds: 'Travelport (Galileo/Worldspan)', email: 'travelport@example.com' },
        remoteAddress: '127.0.2.10',
      })
      expect(response.status).toBe(201)
      expect(countDemoRequests().count).toBe(1)
    })

    it.each(['Galileo', 'Worldspan', 'None yet'])(
      'accepts legacy gds value "%s" for back-compat',
      async legacy => {
        const response = await request(app, {
          method: 'POST',
          path: '/api/demo',
          body: { ...validPayload, gds: legacy, email: `${legacy.replace(/\W/g, '-').toLowerCase()}@example.com` },
          remoteAddress: '127.0.2.11',
        })
        expect(response.status).toBe(201)
      },
    )

    it('returns 400 for an unknown gds string', async () => {
      const response = await request(app, {
        method: 'POST',
        path: '/api/demo',
        body: { ...validPayload, gds: 'SomeNonsenseGDS', email: 'unknown@example.com' },
        remoteAddress: '127.0.2.12',
      })
      expect(response.status).toBe(400)
      expect(response.json()).toEqual({
        success: false,
        message: 'Invalid demo request',
        field: 'gds',
      })
    })
  })
})
