import { Router } from 'express'

const router = Router()

router.post('/login', (_req, res) => {
  res.status(501).json({ success: false, message: 'Admin login not yet implemented' })
})

router.post('/logout', (_req, res) => {
  res.status(501).json({ success: false, message: 'Admin logout not yet implemented' })
})

router.get('/me', (req, res) => {
  if (!req.admin) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }
  res.json({ success: true, data: { adminId: req.admin.adminId, email: req.admin.email } })
})

export default router
