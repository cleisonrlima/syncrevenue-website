// @vitest-environment node
import { describe, it, expect } from 'vitest'
import express from 'express'
import type { AddressInfo } from 'net'
import { createFormRateLimiter, FORM_RATE_LIMIT_MAX } from './rateLimit'

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

describe('formRateLimiter', () => {
  it('returns JSON 429 envelope after exceeding limit', async () => {
    const app = express()
    app.use(express.json())
    const limiter = createFormRateLimiter({ limit: 2, windowMs: 60_000 })
    app.post('/api/form', limiter, (_req, res) => res.json({ success: true }))

    await withServer(app, async (base) => {
      const r1 = await fetch(`${base}/api/form`, { method: 'POST' })
      expect(r1.status).toBe(200)
      const r2 = await fetch(`${base}/api/form`, { method: 'POST' })
      expect(r2.status).toBe(200)
      const r3 = await fetch(`${base}/api/form`, { method: 'POST' })
      expect(r3.status).toBe(429)
      const body = await r3.json()
      expect(body).toEqual({ success: false, message: expect.any(String) })
    })
  })

  it('default limiter exports correct constants', () => {
    expect(FORM_RATE_LIMIT_MAX).toBe(20)
  })
})
