import { Router } from 'express'
import { createFormRateLimiter } from '../middleware/rateLimit'
import { auditDao } from '../dao/audit.dao'
import { sendNotification } from '../lib/mailer'
import { auditSchema } from '../schemas/audit.schema'

const router = Router()
const auditRateLimiter = createFormRateLimiter()

router.post('/', auditRateLimiter, (req, res) => {
  const result = auditSchema.safeParse(req.body)

  if (!result.success) {
    const field = result.error.issues[0]?.path[0]?.toString()
    res.status(400).json({
      success: false,
      message: 'Invalid audit request',
      ...(field ? { field } : {}),
    })
    return
  }

  const parsed = result.data
  const recent = auditDao.findRecentByEmail(parsed.email, 60)

  if (recent) {
    res.status(200).json({
      success: true,
      message: 'Audit request received',
    })
    return
  }

  const inserted = auditDao.insert(parsed)

  void sendNotification(
    `New Commission Audit Request — ${parsed.company}`,
    [
      `Name: ${parsed.name}`,
      `Email: ${parsed.email}`,
      `Company: ${parsed.company}`,
      `Role: ${parsed.role}`,
      `GDS: ${parsed.gds}`,
      `Notes: ${parsed.notes ?? ''}`,
      `Locale: ${parsed.locale}`,
      `Timestamp: ${inserted.created_at}`,
    ].join('\n')
  ).catch(error => {
    console.error('Audit notification failed:', error)
  })

  res.status(201).json({
    success: true,
    message: 'Audit request received',
  })
})

export default router
