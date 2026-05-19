import { z } from 'zod'

export const LOCALES = ['en', 'pt-BR', 'es'] as const

// Legacy GDS enum — kept for back-compat with audit submissions + admin lead
// types that still reference the pre-Story-6.10 list.
export const GDS_VALUES = ['Amadeus', 'Sabre', 'Galileo', 'Worldspan', 'Other', 'None yet'] as const

// Story 6.10: canonical demo GDS values that the new UI emits.
export const DEMO_GDS_CANONICAL = [
  'Amadeus',
  'Sabre',
  'Travelport (Galileo/Worldspan)',
  'Other',
] as const

// Story 6.10: legacy values still accepted by /api/demo so pre-rename
// production records remain valid on read-side normalization paths.
export const DEMO_GDS_LEGACY = ['Galileo', 'Worldspan', 'None yet'] as const

const DEMO_GDS_ACCEPTED = [...DEMO_GDS_CANONICAL, ...DEMO_GDS_LEGACY] as const

export const demoSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(254),
  company: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(50).optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  role: z.string().trim().min(1).max(200),
  gds: z.enum(DEMO_GDS_ACCEPTED),
  message: z.string().trim().max(2000).optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  locale: z.enum(LOCALES),
})

export type DemoPayload = z.infer<typeof demoSchema>
