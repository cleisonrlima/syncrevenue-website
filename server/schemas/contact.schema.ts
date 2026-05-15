import { z } from 'zod'
import { LOCALES } from './demo.schema'

export const CONTACT_SUBJECT_VALUES = [
  'SyncRevenue',
  'BI/Data Analytics',
  'OBTs',
  'Custom Development',
  'Other',
] as const

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(254),
  subject: z.enum(CONTACT_SUBJECT_VALUES),
  message: z.string().trim().min(1).max(5000),
  locale: z.enum(LOCALES),
})

export type ContactPayload = z.infer<typeof contactSchema>
