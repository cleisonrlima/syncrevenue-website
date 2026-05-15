import nodemailer, { type Transporter } from 'nodemailer'

let cachedTransporter: Transporter | null = null

export function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  })
  return cachedTransporter
}

export function resetTransporterForTesting(): void {
  cachedTransporter = null
}

export async function sendNotification(subject: string, body: string): Promise<void> {
  const to = process.env.NOTIFY_EMAIL
  const from = process.env.SMTP_USER || process.env.NOTIFY_EMAIL
  if (!to || !from) {
    console.warn('Mailer: NOTIFY_EMAIL or SMTP_USER not configured; skipping notification')
    return
  }
  try {
    const transporter = getTransporter()
    await transporter.sendMail({
      from,
      to,
      subject,
      text: body,
    })
  } catch (err) {
    console.error('Mailer: sendNotification failed:', err)
  }
}
