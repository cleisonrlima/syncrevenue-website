import { Router } from 'express'
import { teamDao } from '../../dao/team.dao'

const router = Router()

router.get('/', (_req, res) => {
  const rows = teamDao.list()
  res.json({ success: true, data: rows })
})

export default router
