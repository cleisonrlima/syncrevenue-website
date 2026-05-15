import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AdminTokenPayload {
  adminId: number
  email: string
  iat?: number
  exp?: number
}

declare module 'express-serve-static-core' {
  interface Request {
    admin?: AdminTokenPayload
  }
}

export const AUTH_COOKIE_NAME = 'admin_token'

function unauthorized(res: Response): void {
  res.status(401).json({ success: false, message: 'Unauthorized' })
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    res.status(500).json({ success: false, message: 'Auth not configured' })
    return
  }
  const token = (req as Request & { cookies?: Record<string, string | undefined> }).cookies?.[
    AUTH_COOKIE_NAME
  ]
  if (!token) {
    unauthorized(res)
    return
  }
  try {
    const payload = jwt.verify(token, secret) as AdminTokenPayload
    if (typeof payload?.adminId !== 'number' || typeof payload?.email !== 'string') {
      unauthorized(res)
      return
    }
    req.admin = payload
    next()
  } catch {
    unauthorized(res)
  }
}
