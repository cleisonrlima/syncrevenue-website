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
  subject: 'support',
  message: 'We need analytics help for agency revenue reporting.',
  locale: 'pt-BR',
}

async function createIsolatedApp() {
  vi.resetModules()
  sendNotificationMock.mockReset()
  sendNotificationMock.mockResolvedValue(undefined)

  currentTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrev-contact-route-db-'))
  process.env.DB_PATH = path.join(currentTempDir, 'test.db')
  process.env.ALLOWED_ORIGIN = 'http://localhost:5173'
  process.env.JWT_SECRET = 'test-secret'

  const [{ createApp }, dbModule] = await Promise.all([import('../index'), import('../db')])
  currentDb = dbModule.default
  app = createApp()
}

function contactRows() {
  return currentDb?.prepare('SELECT * FROM contacts ORDER BY id ASC').all() as Array<{
    name: string
    email: string
    subject: string
    message: string
    locale: string
    created_at: string
  }>
}

function contactTableExists(): boolean {
  const row = currentDb
    ?.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'contacts'")
    .get() as { name: string } | undefined
  return row?.name === 'contacts'
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

describe('POST /api/contact', () => {
  it('inserts a valid contact request and sends the exact notification contract', async () => {
    const response = await request(app, {
      method: 'POST',
      path: '/api/contact',
      body: validPayload,
      remoteAddress: '127.0.3.1',
    })

    expect(response.status).toBe(201)
    expect(response.json()).toEqual({
      success: true,
      message: expect.any(String),
    })
    expect(contactRows()).toMatchObject([
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        subject: 'support',
        message: 'We need analytics help for agency revenue reporting.',
        locale: 'pt-BR',
      },
    ])
    expect(sendNotificationMock).toHaveBeenCalledTimes(1)
    expect(sendNotificationMock).toHaveBeenCalledWith(
      'New Contact — support',
      [
        'Name: Jane Smith',
        'Email: jane@example.com',
        'Subject: support',
        'Message: We need analytics help for agency revenue reporting.',
        'Locale: pt-BR',
        `Timestamp: ${contactRows()[0].created_at}`,
      ].join('\n')
    )
  })

  it('returns a 200 success envelope for duplicate email retry without insert or notification', async () => {
    await request(app, {
      method: 'POST',
      path: '/api/contact',
      body: validPayload,
      remoteAddress: '127.0.3.2',
    })

    const duplicate = await request(app, {
      method: 'POST',
      path: '/api/contact',
      body: { ...validPayload, subject: 'partnerships' },
      remoteAddress: '127.0.3.3',
    })

    expect(duplicate.status).toBe(200)
    expect(duplicate.json()).toEqual({
      success: true,
      message: expect.any(String),
    })
    expect(contactRows()).toHaveLength(1)
    expect(sendNotificationMock).toHaveBeenCalledTimes(1)
  })

  it('returns HTTP 400 with a field for validation failures', async () => {
    const response = await request(app, {
      method: 'POST',
      path: '/api/contact',
      body: { ...validPayload, email: 'not-an-email' },
      remoteAddress: '127.0.3.4',
    })

    expect(response.status).toBe(400)
    expect(response.json()).toEqual({
      success: false,
      message: 'Invalid contact request',
      field: 'email',
    })
    expect(contactRows()).toHaveLength(0)
    expect(sendNotificationMock).not.toHaveBeenCalled()
  })

  it('enforces locale and subject allowlists before insert', async () => {
    const badLocale = await request(app, {
      method: 'POST',
      path: '/api/contact',
      body: { ...validPayload, locale: 'fr' },
      remoteAddress: '127.0.3.5',
    })
    const badSubject = await request(app, {
      method: 'POST',
      path: '/api/contact',
      body: { ...validPayload, subject: 'Partnerships' },
      remoteAddress: '127.0.3.6',
    })

    expect(badLocale.status).toBe(400)
    expect(badLocale.json()).toEqual({
      success: false,
      message: 'Invalid contact request',
      field: 'locale',
    })
    expect(badSubject.status).toBe(400)
    expect(badSubject.json()).toEqual({
      success: false,
      message: 'Invalid contact request',
      field: 'subject',
    })
    expect(contactRows()).toHaveLength(0)
  })

  it('stores SQL injection-shaped input literally without surfacing SQL errors', async () => {
    const malicious = "Robert'); DROP TABLE contacts;--"
    const response = await request(app, {
      method: 'POST',
      path: '/api/contact',
      body: {
        ...validPayload,
        email: 'robert.contact@example.com',
        message: malicious,
      },
      remoteAddress: '127.0.3.50',
    })

    expect(response.status).toBe(201)
    expect(response.body).not.toMatch(/SQLITE|syntax error|DROP TABLE/i)
    expect(contactTableExists()).toBe(true)
    expect(contactRows()).toMatchObject([
      {
        email: 'robert.contact@example.com',
        message: malicious,
      },
    ])

    const followUp = await request(app, {
      method: 'POST',
      path: '/api/contact',
      body: { ...validPayload, email: 'after-injection-contact@example.com' },
      remoteAddress: '127.0.3.51',
    })
    expect(followUp.status).toBe(201)
    expect(contactRows()).toHaveLength(2)
  })

  it('does not let notification failure block the database success response', async () => {
    sendNotificationMock.mockRejectedValueOnce(new Error('SMTP unavailable'))

    const response = await request(app, {
      method: 'POST',
      path: '/api/contact',
      body: validPayload,
      remoteAddress: '127.0.3.7',
    })

    expect(response.status).toBe(201)
    expect(contactRows()).toHaveLength(1)
    expect(sendNotificationMock).toHaveBeenCalledTimes(1)
  })

  it('returns before notification delivery resolves', async () => {
    sendNotificationMock.mockReturnValueOnce(new Promise(() => undefined))

    const response = await request(app, {
      method: 'POST',
      path: '/api/contact',
      body: validPayload,
      remoteAddress: '127.0.3.8',
    })

    expect(response.status).toBe(201)
    expect(contactRows()).toHaveLength(1)
    expect(sendNotificationMock).toHaveBeenCalledTimes(1)
  })
})
