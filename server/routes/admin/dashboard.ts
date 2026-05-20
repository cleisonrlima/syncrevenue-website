import { Router } from 'express'
import { leadsDao } from '../../dao/leads.dao'

const router = Router()

router.get('/stats', (_req, res) => {
  const data = leadsDao.countStats()
  res.json({ success: true, data })
})

export default router
