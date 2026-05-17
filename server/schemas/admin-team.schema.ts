import { z } from 'zod'

const requiredTrimmedString = (max = 500) =>
  z.string().trim().min(1).max(max)

const requiredTrimmedText = (max = 4000) =>
  z.string().trim().min(1).max(max)

// Accepts a valid URL, an empty string, or omission. Empty / omitted normalize
// to null after parsing (the team_members SQLite columns are nullable). An
// invalid URL fails validation with the field name in the issue path.
const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .url()
  .or(z.literal(''))
  .optional()

const orderIndex = z.coerce.number().int().min(0).default(0)

const teamMemberBaseShape = {
  name: requiredTrimmedString(200),
  role_en: requiredTrimmedString(200),
  role_pt: requiredTrimmedString(200),
  role_es: requiredTrimmedString(200),
  bio_en: requiredTrimmedText(4000),
  bio_pt: requiredTrimmedText(4000),
  bio_es: requiredTrimmedText(4000),
  linkedin: optionalUrl,
  photo_url: optionalUrl,
  order_index: orderIndex,
}

const normalizeOptionalUrls = <
  T extends { linkedin?: string | null | undefined; photo_url?: string | null | undefined }
>(value: T) => ({
  ...value,
  linkedin: value.linkedin && value.linkedin.length > 0 ? value.linkedin : null,
  photo_url: value.photo_url && value.photo_url.length > 0 ? value.photo_url : null,
})

export const adminTeamCreateSchema = z
  .object(teamMemberBaseShape)
  .transform(normalizeOptionalUrls)

export const adminTeamUpdateSchema = z
  .object(teamMemberBaseShape)
  .transform(normalizeOptionalUrls)

export const adminTeamParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type AdminTeamCreateInput = z.infer<typeof adminTeamCreateSchema>
export type AdminTeamUpdateInput = z.infer<typeof adminTeamUpdateSchema>
export type AdminTeamParams = z.infer<typeof adminTeamParamsSchema>
