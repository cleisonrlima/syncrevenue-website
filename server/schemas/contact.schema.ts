import { z } from 'zod'
import { LOCALES } from './demo.schema'

/**
 * Story 6.11 — Contact subject routing enum reconciled to the design-handoff
 * routing intents (commercial / support / partnerships / press / other).
 * Replaces the Story 2.3 service-shaped enum. Old DB records remain readable
 * (DB column is TEXT) but new submissions must land one of these values.
 */
export const CONTACT_SUBJECT_VALUES = [
  'commercial',
  'support',
  'partnerships',
  'press',
  'other',
] as const

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(254),
  subject: z.enum(CONTACT_SUBJECT_VALUES),
  message: z.string().trim().min(1).max(5000),
  locale: z.enum(LOCALES),
})

export type ContactPayload = z.infer<typeof contactSchema>
