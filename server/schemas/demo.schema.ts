import { z } from 'zod'

export const LOCALES = ['en', 'pt-BR', 'es'] as const
export const GDS_VALUES = ['Amadeus', 'Sabre', 'Galileo', 'Worldspan', 'Other', 'None yet'] as const

export const demoSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(254),
  company: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(50).optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  role: z.string().trim().min(1).max(200),
  gds: z.enum(GDS_VALUES),
  message: z.string().trim().max(2000).optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  locale: z.enum(LOCALES),
})

export type DemoPayload = z.infer<typeof demoSchema>
