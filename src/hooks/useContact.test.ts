import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18next from 'i18next'
import '@/i18n'
import { ContactApiError, postContact } from '@/lib/api'
import {
  CONTACT_SUBJECT_OPTIONS,
  createContactSchema,
  isContactFormValid,
  useContact,
  type ContactFormValues,
} from './useContact'

vi.mock('@/lib/api', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    postContact: vi.fn(),
  }
})

const postContactMock = vi.mocked(postContact)

const validValues: ContactFormValues = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  subject: 'BI/Data Analytics',
  message: 'We need analytics support.',
  locale: 'en',
}

beforeEach(() => {
  postContactMock.mockReset()
  i18next.changeLanguage('en')
})

describe('useContact', () => {
  it('exports the fixed contact subject options', () => {
    expect(CONTACT_SUBJECT_OPTIONS).toEqual([
      'SyncRevenue',
      'BI/Data Analytics',
      'OBTs',
      'Custom Development',
      'Other',
    ])
  })

  it('exports a locale-aware Zod schema for contact validation messages', async () => {
    expect(createContactSchema(i18next.t).safeParse({ ...validValues, email: 'bad' }).error?.issues[0]?.message).toBe(
      'Enter a valid email address'
    )

    await i18next.changeLanguage('pt-BR')
    expect(createContactSchema(i18next.t).safeParse({ ...validValues, message: '' }).error?.issues[0]?.message).toBe(
      'Mensagem é obrigatória'
    )
  })

  it('validates required fields and subject allowlist', () => {
    expect(isContactFormValid(validValues)).toBe(true)
    expect(isContactFormValid({ ...validValues, subject: 'Partnerships' })).toBe(false)
    expect(isContactFormValid({ ...validValues, message: '' })).toBe(false)
    expect(isContactFormValid({ ...validValues, locale: 'fr' as ContactFormValues['locale'] })).toBe(false)
  })

  it('submits a valid payload and transitions through submitting to success', async () => {
    let resolvePost: (value: { success: true; message: string }) => void = () => {}
    postContactMock.mockReturnValue(
      new Promise(resolve => {
        resolvePost = resolve
      })
    )

    const { result } = renderHook(() => useContact())

    let submitPromise: Promise<boolean> = Promise.resolve(false)
    act(() => {
      submitPromise = result.current.submitContact(validValues)
    })

    expect(result.current.status).toBe('submitting')
    expect(result.current.error).toBeNull()
    expect(postContactMock).toHaveBeenCalledWith(validValues)

    await act(async () => {
      resolvePost({ success: true, message: 'Contact message received' })
      await submitPromise
    })

    expect(result.current.status).toBe('success')
    expect(result.current.error).toBeNull()
  })

  it('guards invalid form state without making an API call', async () => {
    const { result } = renderHook(() => useContact())

    await act(async () => {
      const ok = await result.current.submitContact({ ...validValues, email: '' })
      expect(ok).toBe(false)
    })

    expect(postContactMock).not.toHaveBeenCalled()
    expect(result.current.status).toBe('idle')
  })

  it('guards duplicate submissions before React re-renders the submitting state', async () => {
    let resolvePost: (value: { success: true; message: string }) => void = () => {}
    postContactMock.mockReturnValue(
      new Promise(resolve => {
        resolvePost = resolve
      })
    )

    const { result } = renderHook(() => useContact())

    let firstSubmit: Promise<boolean> = Promise.resolve(false)
    let secondSubmit: Promise<boolean> = Promise.resolve(true)
    act(() => {
      firstSubmit = result.current.submitContact(validValues)
      secondSubmit = result.current.submitContact(validValues)
    })

    expect(postContactMock).toHaveBeenCalledTimes(1)
    await expect(secondSubmit).resolves.toBe(false)

    await act(async () => {
      resolvePost({ success: true, message: 'Contact message received' })
      await firstSubmit
    })
  })

  it('keeps values retryable after a non-429 API failure', async () => {
    postContactMock.mockRejectedValueOnce(new ContactApiError(500, 'Try again'))

    const { result } = renderHook(() => useContact())

    await act(async () => {
      const ok = await result.current.submitContact(validValues)
      expect(ok).toBe(false)
    })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toEqual({ message: 'Try again', status: 500 })
  })

  it('preserves 429 error state for inline rate-limit rendering', async () => {
    postContactMock.mockRejectedValueOnce(new ContactApiError(429, 'Too many requests'))

    const { result } = renderHook(() => useContact())

    await act(async () => {
      const ok = await result.current.submitContact(validValues)
      expect(ok).toBe(false)
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toEqual({ message: 'Too many requests', status: 429 })
  })
})
