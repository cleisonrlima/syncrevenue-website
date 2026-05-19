import { z } from 'zod'
import { LOCALES, DEMO_GDS_CANONICAL, DEMO_GDS_LEGACY } from './demo.schema'

// Story 6.13: audit pipeline accepts the same GDS values as the demo pipeline
// (canonical 4 + legacy 3). Front-end emits only canonical now; legacy stays
// here so pre-rename audit submissions and admin lead types remain valid.
const AUDIT_GDS_ACCEPTED = [...DEMO_GDS_CANONICAL, ...DEMO_GDS_LEGACY] as const

export const auditSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(254),
  company: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(200),
  gds: z.enum(AUDIT_GDS_ACCEPTED),
  notes: z.string().trim().max(2000).optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  locale: z.enum(LOCALES),
})

export type AuditPayload = z.infer<typeof auditSchema>
