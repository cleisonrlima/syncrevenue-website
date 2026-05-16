import { useRef, useState } from 'react'
import type { TFunction } from 'i18next'
import { z } from 'zod'
import { DemoApiError, postDemo, type DemoPayload } from '@/lib/api'

export type DemoStatus = 'idle' | 'submitting' | 'success' | 'error'
export type DemoLocale = DemoPayload['locale']
export type DemoFormValues = DemoPayload

export const GDS_OPTIONS = ['Amadeus', 'Sabre', 'Galileo', 'Worldspan', 'Other', 'None yet'] as const
export const ROLE_OPTIONS = ['Owner', 'Executive', 'Operations', 'Finance', 'Technology', 'Other'] as const
const LOCALE_OPTIONS = ['en', 'pt-BR', 'es'] as const
const identityT = ((key: string) => key) as TFunction

type DemoError = {
  message: string
  status?: number
  field?: string
}

export function createDemoSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(1, t('forms.demo.nameError', { defaultValue: 'Full name is required' })),
    email: z.string().trim().email(t('forms.demo.emailError', { defaultValue: 'Enter a valid email address' })),
    company: z.string().trim().min(1, t('forms.demo.companyError', { defaultValue: 'Company name is required' })),
    phone: z.string(),
    role: z.enum(ROLE_OPTIONS, {
      errorMap: () => ({ message: t('forms.demo.roleError', { defaultValue: 'Please select your role' }) }),
    }),
    gds: z.enum(GDS_OPTIONS, {
      errorMap: () => ({ message: t('forms.demo.gdsError', { defaultValue: 'Please select your primary GDS' }) }),
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
