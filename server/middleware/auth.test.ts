// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import express from 'express'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import { requireAdmin, AUTH_COOKIE_NAME } from './auth'
import { request } from '../test-utils/request'

function buildApp() {
  const app = express()
  app.use(cookieParser())
  app.get('/protected', requireAdmin, (req, res) => {
    res.json({ success: true, data: req.admin })
  })
  return app
}

const SECRET = 'test-secret'

describe('requireAdmin', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = SECRET
  })

  it('401 when no cookie', async () => {
    const r = await request(buildApp(), { path: '/protected' })
    expect(r.status).toBe(401)
    expect(r.json()).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('401 when token invalid', async () => {
    const r = await request(buildApp(), {
      path: '/protected',
      headers: { cookie: `${AUTH_COOKIE_NAME}=garbage` },
    })
    expect(r.status).toBe(401)
  })

  it('401 when token expired', async () => {
    const token = jwt.sign({ adminId: 1, email: 'a@b.com' }, SECRET, { expiresIn: -10 })
    const r = await request(buildApp(), {
      path: '/protected',
      headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
    })
    expect(r.status).toBe(401)
  })

  it('attaches req.admin on valid token', async () => {
    const token = jwt.sign({ adminId: 7, email: 'admin@x.com' }, SECRET, { expiresIn: '8h' })
    const r = await request(buildApp(), {
      path: '/protected',
      headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
    })
    expect(r.status).toBe(200)
    const body = r.json<{ data: { adminId: number; email: string } }>()
    expect(body.data.adminId).toBe(7)
    expect(body.data.email).toBe('admin@x.com')
  })

  it('500 when JWT_SECRET missing', async () => {
    delete process.env.JWT_SECRET
    const r = await request(buildApp(), {
      path: '/protected',
      headers: { cookie: `${AUTH_COOKIE_NAME}=anything` },
    })
    expect(r.status).toBe(500)
  })
})
