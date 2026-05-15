// @vitest-environment node
import { describe, it, expect } from 'vitest'
import express from 'express'
import { createFormRateLimiter, FORM_RATE_LIMIT_MAX } from './rateLimit'
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
    expect(r3.json()).toEqual({ success: false, message: expect.any(String) })
  })

  it('default limiter exports correct constants', () => {
    expect(FORM_RATE_LIMIT_MAX).toBe(20)
  })
})
