import { Router } from 'express'

const router = Router()

router.post('/', (_req, res) => {
  res.status(501).json({
    success: false,
    message: 'Contact submission not yet implemented',
  })
})

export default router
