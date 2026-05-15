import rateLimit, { type Options } from 'express-rate-limit'
import type { Request, Response } from 'express'

export const FORM_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
export const FORM_RATE_LIMIT_MAX = 20

export function createFormRateLimiter(overrides: Partial<Options> = {}) {
  return rateLimit({
    windowMs: FORM_RATE_LIMIT_WINDOW_MS,
    limit: FORM_RATE_LIMIT_MAX,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
      })
    },
    ...overrides,
  })
}

export const formRateLimiter = createFormRateLimiter()
