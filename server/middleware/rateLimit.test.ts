// @vitest-environment node
import { describe, it, expect } from 'vitest'
import express from 'express'
import {
  ADMIN_LOGIN_MAX,
  ADMIN_LOGIN_WINDOW_MS,
  createAdminLoginRateLimiter,
  createFormRateLimiter,
  FORM_RATE_LIMIT_MAX,
} from './rateLimit'
import { request } from '../test-utils/request'

describe('formRateLimiter', () => {
  it('returns JSON 429 envelope after exceeding limit', async () => {
    const app = express()
    app.use(express.json())
    const limiter = createFormRateLimiter({ limit: 2, windowMs: 60_000 })
    app.post('/api/form', limiter, (_req, res) => res.json({ success: true }))

    const r1 = await request(app, { method: 'POST', path: '/api/form' })
    expect(r1.status).toBe(200)
    const r2 = await request(app, { method: 'POST', path: '/api/form' })
    expect(r2.status).toBe(200)
    const r3 = await request(app, { method: 'POST', path: '/api/form' })
    expect(r3.status).toBe(429)
    expect(r3.json()).toEqual({ success: false, message: 'Too many requests' })
    expect(r3.headers.ratelimit).toBeTruthy()
    expect(r3.headers['ratelimit-policy']).toBeTruthy()
    expect(r3.headers['x-ratelimit-limit']).toBeUndefined()
  })

  it('default limiter exports correct constants', () => {
    expect(FORM_RATE_LIMIT_MAX).toBe(20)
  })
})

describe('adminLoginRateLimiter', () => {
  it('exports correct defaults (5 per 15 min)', () => {
    expect(ADMIN_LOGIN_MAX).toBe(5)
    expect(ADMIN_LOGIN_WINDOW_MS).toBe(15 * 60 * 1000)
  })

  it('returns JSON 429 envelope after exceeding limit', async () => {
    const app = express()
    app.use(express.json())
    const limiter = createAdminLoginRateLimiter({ limit: 2, windowMs: 60_000 })
    app.post('/api/admin/auth/login', limiter, (_req, res) =>
      res.status(401).json({ success: false, message: 'Invalid credentials' })
    )

    const r1 = await request(app, { method: 'POST', path: '/api/admin/auth/login' })
    expect(r1.status).toBe(401)
    const r2 = await request(app, { method: 'POST', path: '/api/admin/auth/login' })
    expect(r2.status).toBe(401)
    const r3 = await request(app, { method: 'POST', path: '/api/admin/auth/login' })
    expect(r3.status).toBe(429)
    expect(r3.json()).toEqual({ success: false, message: 'Too many requests' })
  })

  it('does not count successful login responses against the limit', async () => {
    const app = express()
    app.use(express.json())
    const limiter = createAdminLoginRateLimiter({ limit: 2, windowMs: 60_000 })
    app.post('/api/admin/auth/login', limiter, (_req, res) => res.json({ success: true }))

    for (let i = 0; i < 4; i++) {
      const r = await request(app, { method: 'POST', path: '/api/admin/auth/login' })
      expect(r.status).toBe(200)
    }
  })

  it('admin login limiter is independent of form limiter (cross-route)', async () => {
    const app = express()
    app.use(express.json())
    const loginLimiter = createAdminLoginRateLimiter({ limit: 2, windowMs: 60_000 })
    const formLimiter = createFormRateLimiter({ limit: 2, windowMs: 60_000 })
    app.post('/api/admin/auth/login', loginLimiter, (_req, res) =>
      res.status(401).json({ success: false, message: 'Invalid credentials' })
    )
    app.post('/api/demo', formLimiter, (_req, res) => res.json({ success: true }))

    // Exhaust the admin login limiter from one IP
    await request(app, { method: 'POST', path: '/api/admin/auth/login' })
    await request(app, { method: 'POST', path: '/api/admin/auth/login' })
    const exhausted = await request(app, { method: 'POST', path: '/api/admin/auth/login' })
    expect(exhausted.status).toBe(429)

    // /api/demo from the same IP must still be unaffected
    const demo = await request(app, { method: 'POST', path: '/api/demo' })
    expect(demo.status).toBe(200)
  })
})
