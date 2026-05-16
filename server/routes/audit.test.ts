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
  name: 'Marcos Pereira',
  email: 'marcos@example.com',
  company: 'Agencia Sirius',
  role: 'Back-office Manager',
  gds: 'Amadeus',
  notes: 'BSP last 30 days attached.',
  locale: 'pt-BR',
}

async function createIsolatedApp() {
  vi.resetModules()
  sendNotificationMock.mockReset()
  sendNotificationMock.mockResolvedValue(undefined)

  currentTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrev-audit-route-db-'))
  process.env.DB_PATH = path.join(currentTempDir, 'test.db')
  process.env.ALLOWED_ORIGIN = 'http://localhost:5173'
  process.env.JWT_SECRET = 'test-secret'

  const [{ createApp }, dbModule] = await Promise.all([import('../index'), import('../db')])
  currentDb = dbModule.default
  app = createApp()
}

function countAuditRequests(): { count: number } {
  return currentDb
    ?.prepare('SELECT COUNT(*) as count FROM audit_requests')
    .get() as { count: number }
}

function latestAuditRequest(): { created_at: string } {
  return currentDb
    ?.prepare('SELECT created_at FROM audit_requests ORDER BY id DESC LIMIT 1')
    .get() as { created_at: string }
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

describe('POST /api/audit', () => {
  it('inserts a valid audit request and sends the exact notification contract', async () => {
    const response = await request(app, {
      method: 'POST',
      path: '/api/audit',
      body: validPayload,
      remoteAddress: '127.0.3.1',
    })

    expect(response.status).toBe(201)
    expect(response.json()).toEqual({
      success: true,
      message: expect.any(String),
    })
    expect(countAuditRequests().count).toBe(1)
    expect(sendNotificationMock).toHaveBeenCalledTimes(1)
    expect(sendNotificationMock).toHaveBeenCalledWith(
      'New Commission Audit Request — Agencia Sirius',
      [
        'Name: Marcos Pereira',
        'Email: marcos@example.com',
        'Company: Agencia Sirius',
        'Role: Back-office Manager',
        'GDS: Amadeus',
        'Notes: BSP last 30 days attached.',
        'Locale: pt-BR',
        `Timestamp: ${latestAuditRequest().created_at}`,
      ].join('\n')
    )
  })

  it('returns a 200 success envelope for duplicate email retry without inserting again', async () => {
    await request(app, {
      method: 'POST',
      path: '/api/audit',
      body: validPayload,
      remoteAddress: '127.0.3.2',
    })

    const duplicate = await request(app, {
      method: 'POST',
      path: '/api/audit',
      body: validPayload,
      remoteAddress: '127.0.3.3',
    })

    expect(duplicate.status).toBe(200)
    expect(duplicate.json()).toEqual({
      success: true,
      message: expect.any(String),
    })
    expect(countAuditRequests().count).toBe(1)
    expect(sendNotificationMock).toHaveBeenCalledTimes(1)
  })

  it('returns HTTP 400 with a field for validation failures', async () => {
    const response = await request(app, {
      method: 'POST',
      path: '/api/audit',
      body: { ...validPayload, email: 'not-an-email' },
      remoteAddress: '127.0.3.4',
    })

    expect(response.status).toBe(400)
    expect(response.json()).toEqual({
      success: false,
      message: 'Invalid audit request',
      field: 'email',
    })
    expect(countAuditRequests().count).toBe(0)
    expect(sendNotificationMock).not.toHaveBeenCalled()
  })

  it('enforces locale allowlist before insert', async () => {
    const response = await request(app, {
      method: 'POST',
      path: '/api/audit',
      body: { ...validPayload, locale: 'fr' },
      remoteAddress: '127.0.3.5',
    })

    expect(response.status).toBe(400)
    expect(response.json()).toEqual({
      success: false,
      message: 'Invalid audit request',
      field: 'locale',
    })
    expect(countAuditRequests().count).toBe(0)
  })

  it('does not let notification failure block the database success response', async () => {
    sendNotificationMock.mockRejectedValueOnce(new Error('SMTP unavailable'))

    const response = await request(app, {
      method: 'POST',
      path: '/api/audit',
      body: validPayload,
      remoteAddress: '127.0.3.6',
    })

    expect(response.status).toBe(201)
    expect(response.json()).toEqual({
      success: true,
      message: expect.any(String),
    })
    expect(countAuditRequests().count).toBe(1)
  })

  it('returns before notification delivery resolves', async () => {
    sendNotificationMock.mockReturnValueOnce(new Promise(() => undefined))

    const response = await request(app, {
      method: 'POST',
      path: '/api/audit',
      body: validPayload,
      remoteAddress: '127.0.3.7',
    })

    expect(response.status).toBe(201)
    expect(countAuditRequests().count).toBe(1)
    expect(sendNotificationMock).toHaveBeenCalledTimes(1)
  })

  it('accepts empty notes and stores them as null/empty', async () => {
    const response = await request(app, {
      method: 'POST',
      path: '/api/audit',
      body: { ...validPayload, notes: '' },
      remoteAddress: '127.0.3.8',
    })

    expect(response.status).toBe(201)
    const row = currentDb
      ?.prepare('SELECT notes FROM audit_requests ORDER BY id DESC LIMIT 1')
      .get() as { notes: string | null }
    expect(row.notes).toBeNull()
  })
})
