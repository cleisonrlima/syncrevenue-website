import { Router } from 'express'
import { formRateLimiter } from '../middleware/rateLimit'
import { leadsDao } from '../dao/leads.dao'
import { sendNotification } from '../lib/mailer'
import { demoSchema } from '../schemas/demo.schema'

const router = Router()

router.post('/', formRateLimiter, (req, res) => {
  const result = demoSchema.safeParse(req.body)

  if (!result.success) {
    const field = result.error.issues[0]?.path[0]?.toString()
    res.status(400).json({
      success: false,
      message: 'Invalid demo request',
      ...(field ? { field } : {}),
    })
    return
  }

  const parsed = result.data
  const recent = leadsDao.findRecentByEmail(parsed.email, 60)

  if (recent) {
    res.status(200).json({
      success: true,
      message: 'Demo request received',
    })
    return
  }

  const inserted = leadsDao.insert(parsed)

  void sendNotification(
    `New Demo Request — ${parsed.company}`,
    [
      `Name: ${parsed.name}`,
      `Email: ${parsed.email}`,
      `Company: ${parsed.company}`,
      `Phone: ${parsed.phone ?? ''}`,
      `Role: ${parsed.role}`,
      `GDS: ${parsed.gds}`,
      `Message: ${parsed.message ?? ''}`,
      `Locale: ${parsed.locale}`,
      `Timestamp: ${inserted.created_at}`,
    ].join('\n')
  ).catch(error => {
    console.error('Demo notification failed:', error)
  })

  res.status(201).json({
    success: true,
    message: 'Demo request received',
  })
})

export default router
