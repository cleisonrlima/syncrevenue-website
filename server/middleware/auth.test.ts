// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import express from 'express'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import type { AddressInfo } from 'net'
import { requireAdmin, AUTH_COOKIE_NAME } from './auth'

async function withServer<T>(app: express.Express, fn: (base: string) => Promise<T>): Promise<T> {
  const server = app.listen(0)
  await new Promise<void>((resolve) => server.on('listening', () => resolve()))
  const { port } = server.address() as AddressInfo
  try {
    return await fn(`http://127.0.0.1:${port}`)
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}

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
    await withServer(buildApp(), async (base) => {
      const r = await fetch(`${base}/protected`)
      expect(r.status).toBe(401)
      expect(await r.json()).toEqual({ success: false, message: 'Unauthorized' })
    })
  })

  it('401 when token invalid', async () => {
    await withServer(buildApp(), async (base) => {
      const r = await fetch(`${base}/protected`, {
        headers: { cookie: `${AUTH_COOKIE_NAME}=garbage` },
      })
      expect(r.status).toBe(401)
    })
  })

  it('401 when token expired', async () => {
    const token = jwt.sign({ adminId: 1, email: 'a@b.com' }, SECRET, { expiresIn: -10 })
    await withServer(buildApp(), async (base) => {
      const r = await fetch(`${base}/protected`, {
        headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
      })
      expect(r.status).toBe(401)
    })
  })

  it('attaches req.admin on valid token', async () => {
    const token = jwt.sign({ adminId: 7, email: 'admin@x.com' }, SECRET, { expiresIn: '8h' })
    await withServer(buildApp(), async (base) => {
      const r = await fetch(`${base}/protected`, {
        headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
      })
      expect(r.status).toBe(200)
      const body = await r.json()
      expect(body.data.adminId).toBe(7)
      expect(body.data.email).toBe('admin@x.com')
    })
  })

  it('500 when JWT_SECRET missing', async () => {
    delete process.env.JWT_SECRET
    await withServer(buildApp(), async (base) => {
      const r = await fetch(`${base}/protected`, {
        headers: { cookie: `${AUTH_COOKIE_NAME}=anything` },
      })
      expect(r.status).toBe(500)
    })
  })
})
