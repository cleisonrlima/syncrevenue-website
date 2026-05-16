import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18next from 'i18next'
import '@/i18n'
import { AuditApiError, postAudit } from '@/lib/api'
import { createAuditSchema, isAuditFormValid, useAudit, type AuditFormValues } from './useAudit'

vi.mock('@/lib/api', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    postAudit: vi.fn(),
  }
})

const postAuditMock = vi.mocked(postAudit)

const validValues: AuditFormValues = {
  name: 'Marcos Pereira',
  email: 'marcos@example.com',
  company: 'Agencia Sirius',
  role: 'Operations',
  gds: 'Amadeus',
  notes: 'BSP last 30 days attached.',
  locale: 'pt-BR',
}

beforeEach(() => {
  postAuditMock.mockReset()
  i18next.changeLanguage('en')
})

describe('useAudit', () => {
  it('exports a locale-aware Zod schema for audit validation messages', () => {
    const enResult = createAuditSchema(i18next.t).safeParse({ ...validValues, name: '' })
    expect(enResult.success).toBe(false)
    if (!enResult.success) {
      expect(enResult.error.issues[0]?.message.length).toBeGreaterThan(0)
    }
  })

  it('validates required fields, option allowlists, and locale allowlist', () => {
    expect(isAuditFormValid(validValues)).toBe(true)
    expect(isAuditFormValid({ ...validValues, role: 'Sales' })).toBe(false)
    expect(isAuditFormValid({ ...validValues, gds: 'Apollo' })).toBe(false)
    expect(isAuditFormValid({ ...validValues, locale: 'fr' as AuditFormValues['locale'] })).toBe(false)
  })

  it('submits a valid payload and transitions through submitting to success', async () => {
    let resolvePost: (value: { success: true; message: string }) => void = () => {}
    postAuditMock.mockReturnValue(
      new Promise(resolve => {
        resolvePost = resolve
      })
    )

    const { result } = renderHook(() => useAudit())

    let submitPromise: Promise<boolean> = Promise.resolve(false)
    act(() => {
      submitPromise = result.current.submitAudit(validValues)
    })

    expect(result.current.status).toBe('submitting')
    expect(result.current.error).toBeNull()
    expect(postAuditMock).toHaveBeenCalledWith(validValues)

    await act(async () => {
      resolvePost({ success: true, message: 'Audit request received' })
      await submitPromise
    })

    expect(result.current.status).toBe('success')
    expect(result.current.error).toBeNull()
  })

  it('guards invalid form state without making an API call', async () => {
    const { result } = renderHook(() => useAudit())

    await act(async () => {
      const ok = await result.current.submitAudit({ ...validValues, email: '' })
      expect(ok).toBe(false)
    })

    expect(postAuditMock).not.toHaveBeenCalled()
    expect(result.current.status).toBe('idle')
  })

  it('guards duplicate submissions before React re-renders the submitting state', async () => {
    let resolvePost: (value: { success: true; message: string }) => void = () => {}
    postAuditMock.mockReturnValue(
      new Promise(resolve => {
        resolvePost = resolve
      })
    )

    const { result } = renderHook(() => useAudit())

    let firstSubmit: Promise<boolean> = Promise.resolve(false)
    let secondSubmit: Promise<boolean> = Promise.resolve(true)
    act(() => {
      firstSubmit = result.current.submitAudit(validValues)
      secondSubmit = result.current.submitAudit(validValues)
    })

    expect(postAuditMock).toHaveBeenCalledTimes(1)
    await expect(secondSubmit).resolves.toBe(false)

    await act(async () => {
      resolvePost({ success: true, message: 'Audit request received' })
      await firstSubmit
    })
  })

  it('surfaces 429 status separately so callers can branch on rate-limit', async () => {
    postAuditMock.mockRejectedValueOnce(new AuditApiError(429, 'Too many requests'))

    const { result } = renderHook(() => useAudit())

    await act(async () => {
      const ok = await result.current.submitAudit(validValues)
      expect(ok).toBe(false)
    })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toEqual({ message: 'Too many requests', status: 429 })
  })

  it('keeps values retryable after a non-429 API failure', async () => {
    postAuditMock.mockRejectedValueOnce(new AuditApiError(500, 'Try again'))

    const { result } = renderHook(() => useAudit())

    await act(async () => {
      const ok = await result.current.submitAudit(validValues)
      expect(ok).toBe(false)
    })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toEqual({ message: 'Try again', status: 500 })
  })
})
