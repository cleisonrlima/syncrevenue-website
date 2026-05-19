import { useRef, useState } from 'react'
import type { TFunction } from 'i18next'
import { z } from 'zod'
import { AuditApiError, postAudit, type AuditPayload } from '@/lib/api'
import { DEMO_GDS_OPTIONS, DEMO_GDS_LEGACY_VALUES, ROLE_OPTIONS } from '@/hooks/useDemo'

export type AuditStatus = 'idle' | 'submitting' | 'success' | 'error'
export type AuditLocale = AuditPayload['locale']
export type AuditFormValues = AuditPayload

// Story 6.13: visible audit GDS dropdown values mirror the canonical demo list.
export const AUDIT_GDS_OPTIONS = DEMO_GDS_OPTIONS
// Story 6.13: zod still accepts legacy 3-value records on the wire so pre-rename
// submissions and admin lead types remain valid through the audit pipeline.
const AUDIT_GDS_ACCEPTED = [...DEMO_GDS_OPTIONS, ...DEMO_GDS_LEGACY_VALUES] as const

const LOCALE_OPTIONS = ['en', 'pt-BR', 'es'] as const
const identityT = ((key: string) => key) as TFunction

type AuditError = {
  message: string
  status?: number
  field?: string
}

export function createAuditSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(1, t('forms.audit.nameError', { defaultValue: 'Name is required' })),
    email: z
      .string()
      .trim()
      .min(1, t('forms.audit.emailErrorRequired', { defaultValue: 'Email is required' }))
      .email(t('forms.audit.emailErrorFormat', { defaultValue: 'Enter a valid email' })),
    company: z.string().trim().min(1, t('forms.audit.companyError', { defaultValue: 'Company is required' })),
    role: z.enum(ROLE_OPTIONS, {
      errorMap: () => ({ message: t('forms.audit.roleError', { defaultValue: 'Role is required' }) }),
    }),
    gds: z.enum(AUDIT_GDS_ACCEPTED, {
      errorMap: () => ({ message: t('forms.audit.gdsError', { defaultValue: 'GDS is required' }) }),
    }),
    notes: z.string(),
    locale: z.enum(LOCALE_OPTIONS),
  })
}

export function isAuditFormValid(values: AuditFormValues): boolean {
  return createAuditSchema(identityT).safeParse(values).success
}

export function useAudit() {
  const [status, setStatus] = useState<AuditStatus>('idle')
  const [error, setError] = useState<AuditError | null>(null)
  const isSubmittingRef = useRef(false)

  async function submitAudit(values: AuditFormValues): Promise<boolean> {
    if (isSubmittingRef.current || status === 'submitting' || !isAuditFormValid(values)) {
      return false
    }

    isSubmittingRef.current = true
    setStatus('submitting')
    setError(null)

    try {
      await postAudit(values)
      setStatus('success')
      return true
    } catch (err) {
      if (err instanceof AuditApiError) {
        setError({ message: err.message, status: err.status, field: err.field })
      } else if (err instanceof Error) {
        setError({ message: err.message })
      } else {
        setError({ message: 'Audit request failed' })
      }
      setStatus('error')
      return false
    } finally {
      isSubmittingRef.current = false
    }
  }

  return {
    status,
    error,
    isSubmitting: status === 'submitting',
    submitAudit,
  }
}

export { ROLE_OPTIONS }
