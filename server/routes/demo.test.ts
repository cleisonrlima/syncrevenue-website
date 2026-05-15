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
  it('inserts a valid demo request and returns a success envelope', async () => {
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
})
