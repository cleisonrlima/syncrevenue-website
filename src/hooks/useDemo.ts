import { useRef, useState } from 'react'
import { DemoApiError, postDemo, type DemoPayload } from '@/lib/api'

export type DemoStatus = 'idle' | 'submitting' | 'success' | 'error'
export type DemoLocale = DemoPayload['locale']
export type DemoFormValues = DemoPayload

export const GDS_OPTIONS = ['Amadeus', 'Sabre', 'Galileo', 'Worldspan', 'Other', 'None yet'] as const
export const ROLE_OPTIONS = ['Owner', 'Executive', 'Operations', 'Finance', 'Technology', 'Other'] as const

type DemoError = {
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

export function isDemoFormValid(values: DemoFormValues): boolean {
  return (
    hasRequiredText(values.name) &&
    isValidEmail(values.email) &&
    hasRequiredText(values.company) &&
    hasRequiredText(values.role) &&
    GDS_OPTIONS.includes(values.gds as (typeof GDS_OPTIONS)[number]) &&
    ['en', 'pt-BR', 'es'].includes(values.locale)
  )
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
