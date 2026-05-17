// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import express from 'express'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import Database from 'better-sqlite3'
import { createRequireAdmin, AUTH_COOKIE_NAME } from './auth'
import { initSchema } from '../db'
import { createAdminDao, type AdminDao } from '../dao/admin.dao'
import { request } from '../test-utils/request'

const SECRET = 'test-secret'

function buildApp(dao: AdminDao) {
  const app = express()
  app.use(cookieParser())
  app.get('/protected', createRequireAdmin(dao), (req, res) => {
    res.json({ success: true, data: req.admin })
  })
  return app
}

let dao: AdminDao

beforeEach(() => {
  process.env.JWT_SECRET = SECRET
  const db = new Database(':memory:')
  initSchema(db)
  dao = createAdminDao(db)
  dao.create({ email: 'admin@x.com', password_hash: 'hash' })
})

describe('requireAdmin', () => {
  it('401 when no cookie', async () => {
    const r = await request(buildApp(dao), { path: '/protected' })
    expect(r.status).toBe(401)
    expect(r.json()).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('401 when token invalid', async () => {
    const r = await request(buildApp(dao), {
      path: '/protected',
      headers: { cookie: `${AUTH_COOKIE_NAME}=garbage` },
    })
    expect(r.status).toBe(401)
  })

  it('401 when token expired', async () => {
    const admin = dao.findByEmail('admin@x.com')!
    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, tokenVersion: admin.token_version },
      SECRET,
      { expiresIn: -10 }
    )
    const r = await request(buildApp(dao), {
      path: '/protected',
      headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
    })
    expect(r.status).toBe(401)
  })

  it('attaches req.admin on valid token with matching tokenVersion', async () => {
    const admin = dao.findByEmail('admin@x.com')!
    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, tokenVersion: admin.token_version },
      SECRET,
      { expiresIn: '8h' }
    )
    const r = await request(buildApp(dao), {
      path: '/protected',
      headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
    })
    expect(r.status).toBe(200)
    const body = r.json<{ data: { adminId: number; email: string } }>()
    expect(body.data.adminId).toBe(admin.id)
    expect(body.data.email).toBe('admin@x.com')
    // req.admin must NOT leak tokenVersion onto the request body
    expect((body.data as Record<string, unknown>).tokenVersion).toBeUndefined()
  })

  it('500 when JWT_SECRET missing', async () => {
    delete process.env.JWT_SECRET
    const r = await request(buildApp(dao), {
      path: '/protected',
      headers: { cookie: `${AUTH_COOKIE_NAME}=anything` },
    })
    expect(r.status).toBe(500)
  })

  // Story 4.8 — JWT revocation via tokenVersion
  it('401 when token tokenVersion is stale (admin row bumped after sign)', async () => {
    const admin = dao.findByEmail('admin@x.com')!
    const staleToken = jwt.sign(
      { adminId: admin.id, email: admin.email, tokenVersion: admin.token_version },
      SECRET,
      { expiresIn: '8h' }
    )
    dao.incrementTokenVersion('admin@x.com')
    const r = await request(buildApp(dao), {
      path: '/protected',
      headers: { cookie: `${AUTH_COOKIE_NAME}=${staleToken}` },
    })
    expect(r.status).toBe(401)
    expect(r.json()).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('401 when admin row deleted after token issued', async () => {
    const admin = dao.findByEmail('admin@x.com')!
    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, tokenVersion: admin.token_version },
      SECRET,
      { expiresIn: '8h' }
    )
    dao.deleteByEmail('admin@x.com')
    const r = await request(buildApp(dao), {
      path: '/protected',
      headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
    })
    expect(r.status).toBe(401)
  })

  it('401 when token has no tokenVersion claim (pre-migration tokens)', async () => {
    const admin = dao.findByEmail('admin@x.com')!
    const legacyToken = jwt.sign({ adminId: admin.id, email: admin.email }, SECRET, {
      expiresIn: '8h',
    })
    const r = await request(buildApp(dao), {
      path: '/protected',
      headers: { cookie: `${AUTH_COOKIE_NAME}=${legacyToken}` },
    })
    expect(r.status).toBe(401)
  })

  it('200 with freshly-issued token after a bump (re-login path)', async () => {
    dao.incrementTokenVersion('admin@x.com')
    const refreshed = dao.findByEmail('admin@x.com')!
    expect(refreshed.token_version).toBe(1)
    const freshToken = jwt.sign(
      { adminId: refreshed.id, email: refreshed.email, tokenVersion: refreshed.token_version },
      SECRET,
      { expiresIn: '8h' }
    )
    const r = await request(buildApp(dao), {
      path: '/protected',
      headers: { cookie: `${AUTH_COOKIE_NAME}=${freshToken}` },
    })
    expect(r.status).toBe(200)
  })
})
