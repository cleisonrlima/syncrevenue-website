import { Router } from 'express'
import { formRateLimiter } from '../middleware/rateLimit'
import { contactsDao } from '../dao/contacts.dao'
import { sendNotification } from '../lib/mailer'
import { contactSchema } from '../schemas/contact.schema'

const router = Router()

router.post('/', formRateLimiter, (req, res) => {
  const result = contactSchema.safeParse(req.body)

  if (!result.success) {
    const field = result.error.issues[0]?.path[0]?.toString()
    res.status(400).json({
      success: false,
      message: 'Invalid contact request',
      ...(field ? { field } : {}),
    })
    return
  }

  const parsed = result.data
  const recent = contactsDao.findRecentByEmail(parsed.email, 60)

  if (recent) {
    res.status(200).json({
      success: true,
      message: 'Contact message received',
    })
    return
  }

  const inserted = contactsDao.insert(parsed)

  void sendNotification(
    `New Contact — ${parsed.subject}`,
    [
      `Name: ${parsed.name}`,
      `Email: ${parsed.email}`,
      `Subject: ${parsed.subject}`,
      `Message: ${parsed.message}`,
      `Locale: ${parsed.locale}`,
      `Timestamp: ${inserted.created_at}`,
    ].join('\n')
  ).catch(error => {
    console.error('Contact notification failed:', error)
  })

  res.status(201).json({
    success: true,
    message: 'Contact message received',
  })
})

export default router
