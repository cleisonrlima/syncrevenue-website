import { Router } from 'express'
import { teamDao } from '../dao/team.dao'

// Public surface: all columns are display fields; no PII filtering needed.
const router = Router()

router.get('/', (_req, res) => {
  const rows = teamDao.list({ activeOnly: true })
  res.json({ success: true, data: rows })
})

export default router
