import { Router } from 'express'
import { formRateLimiter } from '../middleware/rateLimit'

const router = Router()

router.post('/', formRateLimiter, (_req, res) => {
  res.status(501).json({
    success: false,
    message: 'Contact submission not yet implemented',
  })
})

export default router
