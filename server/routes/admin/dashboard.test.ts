// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Express } from 'express'
import type Database from 'better-sqlite3'
import path from 'path'
import os from 'os'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import { request } from '../../test-utils/request'
import { AUTH_COOKIE_NAME } from '../../middleware/auth'
import type { DemoRequestInput, LeadsStats } from '../../dao/leads.dao'

const PLAINTEXT = 'correcthorsebatterystaple'
const ADMIN_EMAIL = 'admin@example.com'

let app: Express
let currentDb: Database.Database | undefined
let currentTempDir: string | undefined
let leadsDao: typeof import('../../dao/leads.dao').leadsDao
let adminDao: typeof import('../../dao/admin.dao').adminDao

async function createIsolatedApp() {
  vi.resetModules()
  currentTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrev-admin-dashboard-db-'))
  process.env.DB_PATH = path.join(currentTempDir, 'test.db')
  process.env.ALLOWED_ORIGIN = 'http://localhost:5173'
  process.env.JWT_SECRET = 'test-secret'

  const [{ createApp }, dbModule, adminDaoModule, leadsDaoModule] = await Promise.all([
    import('../../index'),
    import('../../db'),
    import('../../dao/admin.dao'),
    import('../../dao/leads.dao'),
  ])
  currentDb = dbModule.default
  adminDaoModule.adminDao.create({
    email: ADMIN_EMAIL,
    password_hash: bcrypt.hashSync(PLAINTEXT, 12),
  })
  leadsDao = leadsDaoModule.leadsDao
  adminDao = adminDaoModule.adminDao
  app = createApp()
}

function teardown() {
  try {
    currentDb?.close()
  } catch {
    /* ignore */
  }
  currentDb = undefined
  if (currentTempDir && fs.existsSync(currentTempDir)) {
    fs.rmSync(currentTempDir, { recursive: true, force: true })
  }
  currentTempDir = undefined
}

function extractCookieValue(setCookie: string | string[] | undefined, name: string) {
  if (!setCookie) return undefined
  const headers = Array.isArray(setCookie) ? setCookie : [setCookie]
  const match = headers.find((h) => h.startsWith(`${name}=`))
  if (!match) return undefined
  return match.split(';')[0].slice(name.length + 1)
}

async function loginAndGetCookie(): Promise<string> {
  const r = await request(app, {
    method: 'POST',
    path: '/api/admin/auth/login',
    body: { email: ADMIN_EMAIL, password: PLAINTEXT },
  })
  const token = extractCookieValue(
    r.headers['set-cookie'] as string | string[] | undefined,
    AUTH_COOKIE_NAME
  )
  if (!token) throw new Error('login did not return admin_token cookie')
  return token
}

async function authedGet(pathStr: string, token: string) {
  return request(app, {
    method: 'GET',
    path: pathStr,
    headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
  })
}

const baseLead: DemoRequestInput = {
  name: 'Pri',
  email: 'pri@example.com',
  company: 'ACME',
  phone: null,
  role: 'CEO',
  gds: 'Amadeus',
  message: null,
  locale: 'en',
}

type StatsBody = { success: true; data: LeadsStats }
type ErrBody = { success: false; message: string }

describe('GET /api/admin/dashboard/stats', () => {
  beforeEach(async () => {
    await createIsolatedApp()
  })
  afterEach(() => {
    teardown()
  })

  it('401 without cookie', async () => {
    const r = await request(app, { method: 'GET', path: '/api/admin/dashboard/stats' })
    expect(r.status).toBe(401)
    expect(r.json<ErrBody>().message).toBe('Unauthorized')
  })

  it('401 when JWT tokenVersion mismatches (Story 4.8 invariant)', async () => {
    const token = await loginAndGetCookie()
    adminDao.incrementTokenVersion(ADMIN_EMAIL)
    const r = await authedGet('/api/admin/dashboard/stats', token)
    expect(r.status).toBe(401)
  })

  it('200 happy path with empty DB returns all zeros + all three locale keys', async () => {
    const token = await loginAndGetCookie()
    const r = await authedGet('/api/admin/dashboard/stats', token)
    expect(r.status).toBe(200)
    const body = r.json<StatsBody>()
    expect(body.success).toBe(true)
    expect(body.data).toEqual({
      totalLeads: 0,
      pendingLeads: 0,
      leadsThisWeek: 0,
      leadsByLocale: { en: 0, 'pt-BR': 0, es: 0 },
    })
  })

  it('200 with seeded demo requests returns correct counts + breakdown', async () => {
    const token = await loginAndGetCookie()
    leadsDao.insert(baseLead) // en, pending
    leadsDao.insert({ ...baseLead, email: 'b@example.com', locale: 'pt-BR' })
    leadsDao.insert({ ...baseLead, email: 'c@example.com', locale: 'es' })
    leadsDao.insert({ ...baseLead, email: 'd@example.com', locale: 'es' })
    const r = await authedGet('/api/admin/dashboard/stats', token)
    expect(r.status).toBe(200)
    const body = r.json<StatsBody>()
    expect(body.data.totalLeads).toBe(4)
    expect(body.data.pendingLeads).toBe(4)
    expect(body.data.leadsThisWeek).toBe(4)
    expect(body.data.leadsByLocale).toEqual({ en: 1, 'pt-BR': 1, es: 2 })
  })
})
