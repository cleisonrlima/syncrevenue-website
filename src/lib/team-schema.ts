import { z } from 'zod'
import type { TFunction } from 'i18next'
import type { AdminTeamMemberInput } from './api'

// AdminTeamFormValues mirrors the form state — all strings (including
// order_index) to handle in-progress typing. The submit path coerces
// order_index to number via the schema below.
export interface AdminTeamFormValues {
  name: string
  role_en: string
  role_pt: string
  role_es: string
  bio_en: string
  bio_pt: string
  bio_es: string
  experience_en: string
  experience_pt: string
  experience_es: string
  linkedin: string
  photo_url: string
  order_index: string
}

export const initialFormValues: AdminTeamFormValues = {
  name: '',
  role_en: '',
  role_pt: '',
  role_es: '',
  bio_en: '',
  bio_pt: '',
  bio_es: '',
  experience_en: '',
  experience_pt: '',
  experience_es: '',
  linkedin: '',
  photo_url: '',
  order_index: '0',
}

export function createAdminTeamSchema(t: TFunction) {
  const required = (max: number) =>
    z
      .string()
      .trim()
      .min(1, t('admin.team.form.errors.required'))
      .max(max, t('admin.team.form.errors.required'))

  const url = z
    .string()
    .trim()
    .max(2000)
    .url(t('admin.team.form.errors.url'))
    .or(z.literal(''))
    .optional()

  const orderIndex = z
    .preprocess(
      (value) => {
        if (typeof value === 'number') return value
        if (typeof value === 'string') {
          if (value.trim() === '') return undefined
          const num = Number(value)
          return Number.isNaN(num) ? value : num
        }
        return value
      },
      z
        .number({
          invalid_type_error: t('admin.team.form.errors.orderIndex'),
          required_error: t('admin.team.form.errors.orderIndex'),
        })
        .int(t('admin.team.form.errors.orderIndex'))
        .min(0, t('admin.team.form.errors.orderIndex'))
    )

  return z
    .object({
      name: required(200),
      role_en: required(200),
      role_pt: required(200),
      role_es: required(200),
      bio_en: required(4000),
      bio_pt: required(4000),
      bio_es: required(4000),
      experience_en: required(200),
      experience_pt: required(200),
      experience_es: required(200),
      linkedin: url,
      photo_url: url,
      order_index: orderIndex,
    })
    .transform((value): AdminTeamMemberInput => ({
      name: value.name,
      role_en: value.role_en,
      role_pt: value.role_pt,
      role_es: value.role_es,
      bio_en: value.bio_en,
      bio_pt: value.bio_pt,
      bio_es: value.bio_es,
      experience_en: value.experience_en,
      experience_pt: value.experience_pt,
      experience_es: value.experience_es,
      linkedin: value.linkedin && value.linkedin.length > 0 ? value.linkedin : null,
      photo_url: value.photo_url && value.photo_url.length > 0 ? value.photo_url : null,
      order_index: value.order_index,
    }))
}

export type AdminTeamSchema = ReturnType<typeof createAdminTeamSchema>
