import { Router } from 'express'
import { leadsDao, type LeadStatus, type Locale } from '../../dao/leads.dao'

const router = Router()

router.get('/', (req, res) => {
  const status = typeof req.query.status === 'string' ? (req.query.status as LeadStatus) : undefined
  const locale = typeof req.query.locale === 'string' ? (req.query.locale as Locale) : undefined
  const rows = leadsDao.list({ status, locale })
  res.json({ success: true, data: rows })
})

export default router
