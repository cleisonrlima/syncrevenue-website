import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { adminDao as defaultAdminDao, type AdminDao } from '../dao/admin.dao'

export interface AdminTokenPayload {
  adminId: number
  email: string
  // Story 4.8: token_version snapshot at sign time. Optional in the type for
  // forward-compat with pre-migration tokens; runtime check rejects mismatch
  // (including `undefined !== <number>` for tokens signed before the migration).
  tokenVersion?: number
  iat?: number
  exp?: number
}

declare module 'express-serve-static-core' {
  interface Request {
    admin?: { adminId: number; email: string }
  }
}

export const AUTH_COOKIE_NAME = 'admin_token'

function unauthorized(res: Response): void {
  res.status(401).json({ success: false, message: 'Unauthorized' })
}

export function createRequireAdmin(adminDao: AdminDao = defaultAdminDao) {
  return function requireAdmin(req: Request, res: Response, next: NextFunction): void {
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
      // Story 4.8: per-request DB read to enforce token freshness. Single-admin
      // traffic is single-digit RPS; do not cache here (out of scope).
      const row = adminDao.findById(payload.adminId)
      if (!row || payload.tokenVersion !== row.token_version) {
        unauthorized(res)
        return
      }
      req.admin = { adminId: payload.adminId, email: payload.email }
      next()
    } catch {
      unauthorized(res)
    }
  }
}

export const requireAdmin = createRequireAdmin()
