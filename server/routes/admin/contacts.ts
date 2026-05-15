import { Router } from 'express'
import { contactsDao } from '../../dao/contacts.dao'
import type { Locale } from '../../dao/leads.dao'

const router = Router()

router.get('/', (req, res) => {
  const locale = typeof req.query.locale === 'string' ? (req.query.locale as Locale) : undefined
  const readParam = typeof req.query.read === 'string' ? req.query.read : undefined
  const read = readParam === '1' ? 1 : readParam === '0' ? 0 : undefined
  const rows = contactsDao.list({ locale, read: read as 0 | 1 | undefined })
  res.json({ success: true, data: rows })
})

export default router
