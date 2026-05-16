import { useRef, useState } from 'react'
import type { TFunction } from 'i18next'
import { z } from 'zod'
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
const LOCALE_OPTIONS = ['en', 'pt-BR', 'es'] as const
const identityT = ((key: string) => key) as TFunction

type ContactError = {
  message: string
  status?: number
  field?: string
}

export function createContactSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(1, t('forms.contact.nameError', { defaultValue: 'Full name is required' })),
    email: z.string().trim().email(t('forms.contact.emailError', { defaultValue: 'Enter a valid email address' })),
    subject: z.enum(CONTACT_SUBJECT_OPTIONS, {
      errorMap: () => ({ message: t('forms.contact.subjectError', { defaultValue: 'Please select a service area' }) }),
    }),
    message: z.string().trim().min(1, t('forms.contact.messageError', { defaultValue: 'Message is required' })),
    locale: z.enum(LOCALE_OPTIONS),
  })
}

export function isContactFormValid(values: ContactFormValues): boolean {
  return createContactSchema(identityT).safeParse(values).success
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
