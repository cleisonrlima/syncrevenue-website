// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'

const sendMailMock = vi.fn()

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: sendMailMock })),
  },
}))

describe('sendNotification', () => {
  beforeEach(async () => {
    vi.resetModules()
    sendMailMock.mockReset()
    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_USER = 'user@example.com'
    process.env.SMTP_PASS = 'secret'
    process.env.NOTIFY_EMAIL = 'notify@example.com'
  })

  it('calls transporter.sendMail with subject and body', async () => {
    const { sendNotification, resetTransporterForTesting } = await import('./mailer')
    resetTransporterForTesting()
    sendMailMock.mockResolvedValueOnce({ messageId: 'x' })
    await sendNotification('Subj', 'Body')
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'notify@example.com', subject: 'Subj', text: 'Body' })
    )
  })

  it('resolves without throwing when sendMail rejects', async () => {
    const { sendNotification, resetTransporterForTesting } = await import('./mailer')
    resetTransporterForTesting()
    sendMailMock.mockRejectedValueOnce(new Error('SMTP down'))
    await expect(sendNotification('Subj', 'Body')).resolves.toBeUndefined()
  })

  it('skips when NOTIFY_EMAIL not configured', async () => {
    delete process.env.NOTIFY_EMAIL
    const { sendNotification, resetTransporterForTesting } = await import('./mailer')
    resetTransporterForTesting()
    await sendNotification('S', 'B')
    expect(sendMailMock).not.toHaveBeenCalled()
  })
})
