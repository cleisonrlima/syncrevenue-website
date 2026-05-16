import { z } from 'zod'
import { LOCALES, GDS_VALUES } from './demo.schema'

export const auditSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(254),
  company: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(200),
  gds: z.enum(GDS_VALUES),
  notes: z.string().trim().max(2000).optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  locale: z.enum(LOCALES),
})

export type AuditPayload = z.infer<typeof auditSchema>
