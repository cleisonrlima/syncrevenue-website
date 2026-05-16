import { z } from 'zod'

export const adminLeadsQuerySchema = z.object({
  locale: z.enum(['en', 'pt-BR', 'es']).optional(),
  status: z.enum(['pending', 'contacted', 'qualified']).optional(),
})

export type AdminLeadsQuery = z.infer<typeof adminLeadsQuerySchema>
