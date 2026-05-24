import rateLimit, { ipKeyGenerator, type Options } from 'express-rate-limit'
import type { Request, Response } from 'express'

export const FORM_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
export const FORM_RATE_LIMIT_MAX = 20

export const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000
export const ADMIN_LOGIN_MAX = 5

function e2eAwareKeyGenerator(req: Request): string {
  const e2eRemoteAddress = process.env.NODE_ENV === 'test' ? req.get('x-e2e-remote-address') : undefined
  if (e2eRemoteAddress) return e2eRemoteAddress
  return ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? 'unknown')
}

export function createFormRateLimiter(overrides: Partial<Options> = {}) {
  return rateLimit({
    windowMs: FORM_RATE_LIMIT_WINDOW_MS,
    limit: FORM_RATE_LIMIT_MAX,
    keyGenerator: e2eAwareKeyGenerator,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests',
      })
    },
    ...overrides,
  })
}

export function createAdminLoginRateLimiter(overrides: Partial<Options> = {}) {
  return rateLimit({
    windowMs: ADMIN_LOGIN_WINDOW_MS,
    limit: ADMIN_LOGIN_MAX,
    keyGenerator: e2eAwareKeyGenerator,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests',
      })
    },
    ...overrides,
  })
}
