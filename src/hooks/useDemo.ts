import { useRef, useState } from 'react'
import type { TFunction } from 'i18next'
import { z } from 'zod'
import { DemoApiError, postDemo, type DemoPayload } from '@/lib/api'

export type DemoStatus = 'idle' | 'submitting' | 'success' | 'error'
export type DemoLocale = DemoPayload['locale']
export type DemoFormValues = DemoPayload

// Story 6.10: canonical demo GDS dropdown options (4-value list — Travelport
// merges legacy Galileo + Worldspan per design-handoff chat line 273).
export const DEMO_GDS_OPTIONS = [
  'Amadeus',
  'Sabre',
  'Travelport (Galileo/Worldspan)',
  'Other',
] as const

// Story 6.10: legacy GDS values still accepted on the wire for back-compat
// with pre-rename production demo records. New submissions emit canonical.
export const DEMO_GDS_LEGACY_VALUES = ['Galileo', 'Worldspan', 'None yet'] as const

// Legacy union still consumed by CommissionAudit + admin lead types — kept
// intact so non-demo callers don't pick up the merged Travelport label.
export const GDS_OPTIONS = ['Amadeus', 'Sabre', 'Galileo', 'Worldspan', 'Other', 'None yet'] as const

export const ROLE_OPTIONS = ['Owner', 'Executive', 'Operations', 'Finance', 'Technology', 'Other'] as const
const LOCALE_OPTIONS = ['en', 'pt-BR', 'es'] as const
const identityT = ((key: string) => key) as TFunction

const DEMO_GDS_ACCEPTED = [...DEMO_GDS_OPTIONS, ...DEMO_GDS_LEGACY_VALUES] as const

type DemoError = {
  message: string
  status?: number
  field?: string
}

export function createDemoSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(1, t('demo.form.errors.name', { defaultValue: 'Full name is required' })),
    email: z.string().trim().email(t('demo.form.errors.email', { defaultValue: 'Enter a valid email address' })),
    company: z.string().trim().min(1, t('demo.form.errors.company', { defaultValue: 'Agency name is required' })),
    phone: z.string(),
    role: z.enum(ROLE_OPTIONS, {
      errorMap: () => ({ message: t('demo.form.errors.role', { defaultValue: 'Please select your role' }) }),
    }),
    gds: z.enum(DEMO_GDS_ACCEPTED, {
      errorMap: () => ({ message: t('demo.form.errors.gds', { defaultValue: 'Please select your primary GDS' }) }),
    }),
    message: z.string(),
    locale: z.enum(LOCALE_OPTIONS),
  })
}

export function isDemoFormValid(values: DemoFormValues): boolean {
  return createDemoSchema(identityT).safeParse(values).success
}

export function useDemo() {
  const [status, setStatus] = useState<DemoStatus>('idle')
  const [error, setError] = useState<DemoError | null>(null)
  const isSubmittingRef = useRef(false)

  async function submitDemo(values: DemoFormValues): Promise<boolean> {
    if (isSubmittingRef.current || status === 'submitting' || !isDemoFormValid(values)) {
      return false
    }

    isSubmittingRef.current = true
    setStatus('submitting')
    setError(null)

    try {
      await postDemo(values)
      setStatus('success')
      return true
    } catch (err) {
      if (err instanceof DemoApiError) {
        setError({ message: err.message, status: err.status, field: err.field })
      } else if (err instanceof Error) {
        setError({ message: err.message })
      } else {
        setError({ message: 'Demo request failed' })
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
    submitDemo,
  }
}
