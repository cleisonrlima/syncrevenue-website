import { z } from 'zod'

export const adminLeadStatusBodySchema = z.object({
  status: z.enum(['pending', 'contacted', 'qualified']),
})

export const adminLeadStatusParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type AdminLeadStatusBody = z.infer<typeof adminLeadStatusBodySchema>
export type AdminLeadStatusParams = z.infer<typeof adminLeadStatusParamsSchema>
