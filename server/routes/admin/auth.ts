import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { adminDao } from '../../dao/admin.dao'
import { loginSchema } from '../../schemas/admin-auth.schema'
import { AUTH_COOKIE_NAME, requireAdmin } from '../../middleware/auth'

const router = Router()

const COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000
const DUMMY_PASSWORD_HASH = '$2b$12$nqwxTjIvSJwvlSMliNlU5eXYW/NB0tSuHrgmxwex60ntj4E1QeIh6'

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE_MS,
  }
}

function clearCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  }
}

router.post('/login', (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    const field = typeof firstIssue?.path[0] === 'string' ? (firstIssue.path[0] as string) : undefined
    res.status(400).json({
      success: false,
      message: firstIssue?.message ?? 'Invalid payload',
      ...(field ? { field } : {}),
    })
    return
  }

  const { email, password } = parsed.data
  const secret = process.env.JWT_SECRET
  if (!secret) {
    res.status(500).json({ success: false, message: 'Auth not configured' })
    return
  }

  const user = adminDao.findByEmail(email)
  const match = bcrypt.compareSync(password, user?.password_hash ?? DUMMY_PASSWORD_HASH)
  if (!user || !match) {
    res.status(401).json({ success: false, message: 'Invalid credentials' })
    return
  }

  const token = jwt.sign({ adminId: user.id, email: user.email }, secret, { expiresIn: '8h' })
  res.cookie(AUTH_COOKIE_NAME, token, cookieOptions())
  res.status(200).json({ success: true, data: { adminId: user.id, email: user.email } })
})

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME, clearCookieOptions())
  res.status(200).json({ success: true })
})

router.get('/me', requireAdmin, (req, res) => {
  const admin = req.admin
  if (!admin) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }
  res.json({ success: true, data: { adminId: admin.adminId, email: admin.email } })
})

export default router
