import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18next from 'i18next'
import '@/i18n'
import { DemoApiError, postDemo } from '@/lib/api'
import { createDemoSchema, isDemoFormValid, useDemo, type DemoFormValues } from './useDemo'

vi.mock('@/lib/api', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    postDemo: vi.fn(),
  }
})

const postDemoMock = vi.mocked(postDemo)

const validValues: DemoFormValues = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  company: 'Example Travel',
  phone: '+1 305 555 0100',
  role: 'Owner',
  gds: 'Sabre',
  message: 'We need help reconciling commissions.',
  locale: 'en',
}

beforeEach(() => {
  postDemoMock.mockReset()
  i18next.changeLanguage('en')
})

describe('useDemo', () => {
  it('exports a locale-aware Zod schema for demo validation messages', async () => {
    expect(createDemoSchema(i18next.t).safeParse({ ...validValues, name: '' }).error?.issues[0]?.message).toBe(
      'Full name is required'
    )

    await i18next.changeLanguage('es')
    expect(createDemoSchema(i18next.t).safeParse({ ...validValues, gds: '' }).error?.issues[0]?.message).toBe(
      'Por favor seleccione su GDS principal'
    )
  })

  it('validates required fields, option allowlists, and locale allowlist', () => {
    expect(isDemoFormValid(validValues)).toBe(true)
    expect(isDemoFormValid({ ...validValues, role: 'Sales' })).toBe(false)
    expect(isDemoFormValid({ ...validValues, gds: 'Apollo' })).toBe(false)
    expect(isDemoFormValid({ ...validValues, locale: 'fr' as DemoFormValues['locale'] })).toBe(false)
  })

  it('submits a valid payload and transitions through submitting to success', async () => {
    let resolvePost: (value: { success: true; message: string }) => void = () => {}
    postDemoMock.mockReturnValue(
      new Promise(resolve => {
        resolvePost = resolve
      })
    )

    const { result } = renderHook(() => useDemo())

    let submitPromise: Promise<boolean> = Promise.resolve(false)
    act(() => {
      submitPromise = result.current.submitDemo(validValues)
    })

    expect(result.current.status).toBe('submitting')
    expect(result.current.error).toBeNull()
    expect(postDemoMock).toHaveBeenCalledWith(validValues)

    await act(async () => {
      resolvePost({ success: true, message: 'Demo request received' })
      await submitPromise
    })

    expect(result.current.status).toBe('success')
    expect(result.current.error).toBeNull()
  })

  it('guards invalid form state without making an API call', async () => {
    const { result } = renderHook(() => useDemo())

    await act(async () => {
      const ok = await result.current.submitDemo({ ...validValues, email: '' })
      expect(ok).toBe(false)
    })

    expect(postDemoMock).not.toHaveBeenCalled()
    expect(result.current.status).toBe('idle')
  })

  it('guards duplicate submissions before React re-renders the submitting state', async () => {
    let resolvePost: (value: { success: true; message: string }) => void = () => {}
    postDemoMock.mockReturnValue(
      new Promise(resolve => {
        resolvePost = resolve
      })
    )

    const { result } = renderHook(() => useDemo())

    let firstSubmit: Promise<boolean> = Promise.resolve(false)
    let secondSubmit: Promise<boolean> = Promise.resolve(true)
    act(() => {
      firstSubmit = result.current.submitDemo(validValues)
      secondSubmit = result.current.submitDemo(validValues)
    })

    expect(postDemoMock).toHaveBeenCalledTimes(1)
    await expect(secondSubmit).resolves.toBe(false)

    await act(async () => {
      resolvePost({ success: true, message: 'Demo request received' })
      await firstSubmit
    })
  })

  it('keeps values retryable after a non-429 API failure', async () => {
    postDemoMock.mockRejectedValueOnce(new DemoApiError(500, 'Try again'))

    const { result } = renderHook(() => useDemo())

    await act(async () => {
      const ok = await result.current.submitDemo(validValues)
      expect(ok).toBe(false)
    })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toEqual({ message: 'Try again', status: 500 })
  })
})
