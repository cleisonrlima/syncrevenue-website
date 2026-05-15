import { Router } from 'express'
import { requireAdmin } from '../../middleware/auth'

const router = Router()

router.post('/login', (_req, res) => {
  res.status(501).json({ success: false, message: 'Admin login not yet implemented' })
})

router.post('/logout', (_req, res) => {
  res.status(501).json({ success: false, message: 'Admin logout not yet implemented' })
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
