import { useRef, useState } from 'react'
import { ContactApiError, postContact, type ContactPayload } from '@/lib/api'

export type ContactStatus = 'idle' | 'submitting' | 'success' | 'error'
export type ContactLocale = ContactPayload['locale']
export type ContactFormValues = ContactPayload

export const CONTACT_SUBJECT_OPTIONS = [
  'SyncRevenue',
  'BI/Data Analytics',
  'OBTs',
  'Custom Development',
  'Other',
] as const

type ContactError = {
  message: string
  status?: number
  field?: string
}

function hasRequiredText(value: string) {
  return value.trim().length > 0
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function isContactFormValid(values: ContactFormValues): boolean {
  return (
    hasRequiredText(values.name) &&
    isValidEmail(values.email) &&
    CONTACT_SUBJECT_OPTIONS.includes(values.subject as (typeof CONTACT_SUBJECT_OPTIONS)[number]) &&
    hasRequiredText(values.message) &&
    ['en', 'pt-BR', 'es'].includes(values.locale)
  )
}

export function useContact() {
  const [status, setStatus] = useState<ContactStatus>('idle')
  const [error, setError] = useState<ContactError | null>(null)
  const isSubmittingRef = useRef(false)

  async function submitContact(values: ContactFormValues): Promise<boolean> {
    if (isSubmittingRef.current || status === 'submitting' || !isContactFormValid(values)) {
      return false
    }

    isSubmittingRef.current = true
    setStatus('submitting')
    setError(null)

    try {
      await postContact(values)
      setStatus('success')
      return true
    } catch (err) {
      if (err instanceof ContactApiError) {
        setError({ message: err.message, status: err.status, field: err.field })
      } else if (err instanceof Error) {
        setError({ message: err.message })
      } else {
        setError({ message: 'Contact request failed' })
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
    submitContact,
  }
}
