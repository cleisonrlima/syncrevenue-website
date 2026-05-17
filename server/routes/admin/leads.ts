import { Router } from 'express'
import { leadsDao } from '../../dao/leads.dao'
import { adminLeadsQuerySchema } from '../../schemas/admin-leads-query.schema'
import {
  adminLeadStatusBodySchema,
  adminLeadStatusParamsSchema,
} from '../../schemas/admin-lead-status.schema'

const router = Router()

router.get('/', (req, res) => {
  const parsed = adminLeadsQuerySchema.safeParse({
    locale: typeof req.query.locale === 'string' ? req.query.locale : undefined,
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
  })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const field = issue && issue.path.length > 0 ? String(issue.path[0]) : undefined
    res.status(400).json({
      success: false,
      message: 'Invalid query parameter',
      ...(field ? { field } : {}),
    })
    return
  }
  const rows = leadsDao.list({ status: parsed.data.status, locale: parsed.data.locale })
  res.json({ success: true, data: rows })
})

router.patch('/:id/status', (req, res) => {
  const paramsParsed = adminLeadStatusParamsSchema.safeParse({ id: req.params.id })
  if (!paramsParsed.success) {
    const issue = paramsParsed.error.issues[0]
    const field = issue && issue.path.length > 0 ? String(issue.path[0]) : undefined
    res.status(400).json({
      success: false,
      message: 'Invalid lead id',
      ...(field ? { field } : {}),
    })
    return
  }

  const bodyParsed = adminLeadStatusBodySchema.safeParse(req.body ?? {})
  if (!bodyParsed.success) {
    const issue = bodyParsed.error.issues[0]
    const field = issue && issue.path.length > 0 ? String(issue.path[0]) : undefined
    res.status(400).json({
      success: false,
      message: 'Invalid status',
      ...(field ? { field } : {}),
    })
    return
  }

  const updated = leadsDao.updateStatus(paramsParsed.data.id, bodyParsed.data.status)
  if (!updated) {
    res.status(404).json({ success: false, message: 'Lead not found' })
    return
  }

  res.json({ success: true, data: updated })
})

export default router
