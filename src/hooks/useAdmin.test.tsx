import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useAdmin } from './useAdmin'
import { useAdminStore } from '@/store/useAdminStore'
import { AdminApiError } from '@/lib/api'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    postAdminLogin: vi.fn(),
    postAdminLogout: vi.fn(),
    getAdminMe: vi.fn(),
  }
})

const api = await import('@/lib/api')

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

beforeEach(() => {
  navigateMock.mockReset()
  ;(api.postAdminLogin as unknown as Mock).mockReset()
  ;(api.postAdminLogout as unknown as Mock).mockReset()
  ;(api.getAdminMe as unknown as Mock).mockReset()
  useAdminStore.setState({
    isAuthenticated: false,
    adminId: null,
    email: null,
    bootstrapped: false,
  })
})

describe('useAdmin.login', () => {
  it('sets session + navigates to /admin/dashboard on success', async () => {
    ;(api.postAdminLogin as unknown as Mock).mockResolvedValue({
      success: true,
      data: { adminId: 1, email: 'a@b.com' },
    })

    const { result } = renderHook(() => useAdmin(), { wrapper })

    let outcome: boolean | undefined
    await act(async () => {
      outcome = await result.current.login('a@b.com', 'x')
    })

    expect(outcome).toBe(true)
    expect(useAdminStore.getState().isAuthenticated).toBe(true)
    expect(useAdminStore.getState().email).toBe('a@b.com')
    expect(navigateMock).toHaveBeenCalledWith('/admin/dashboard', { replace: true })
  })

  it('sets invalidCredentials errorKey on 401 + does not navigate', async () => {
    ;(api.postAdminLogin as unknown as Mock).mockRejectedValue(
      new AdminApiError(401, 'Invalid credentials')
    )

    const { result } = renderHook(() => useAdmin(), { wrapper })

    let outcome: boolean | undefined
    await act(async () => {
      outcome = await result.current.login('a@b.com', 'bad')
    })

    expect(outcome).toBe(false)
    expect(result.current.errorKey).toBe('admin.login.errors.invalidCredentials')
    expect(useAdminStore.getState().isAuthenticated).toBe(false)
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('maps status=0 to network errorKey', async () => {
    ;(api.postAdminLogin as unknown as Mock).mockRejectedValue(new AdminApiError(0, 'Network'))

    const { result } = renderHook(() => useAdmin(), { wrapper })
    await act(async () => {
      await result.current.login('a@b.com', 'x')
    })
    expect(result.current.errorKey).toBe('admin.login.errors.network')
  })
})

describe('useAdmin.logout', () => {
  it('clears session + navigates to /admin/login', async () => {
    useAdminStore.setState({
      isAuthenticated: true,
      adminId: 1,
      email: 'a@b.com',
      bootstrapped: true,
    })
    ;(api.postAdminLogout as unknown as Mock).mockResolvedValue({ success: true })

    const { result } = renderHook(() => useAdmin(), { wrapper })
    await act(async () => {
      await result.current.logout()
    })

    expect(useAdminStore.getState().isAuthenticated).toBe(false)
    expect(navigateMock).toHaveBeenCalledWith('/admin/login', { replace: true })
  })

  it('still clears session + navigates when logout request fails', async () => {
    useAdminStore.setState({
      isAuthenticated: true,
      adminId: 1,
      email: 'a@b.com',
      bootstrapped: true,
    })
    ;(api.postAdminLogout as unknown as Mock).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useAdmin(), { wrapper })
    await act(async () => {
      await result.current.logout()
    })

    expect(useAdminStore.getState().isAuthenticated).toBe(false)
    expect(navigateMock).toHaveBeenCalledWith('/admin/login', { replace: true })
  })
})

describe('useAdmin.bootstrap', () => {
  it('200 → setSession + bootstrapped', async () => {
    ;(api.getAdminMe as unknown as Mock).mockResolvedValue({ adminId: 9, email: 'a@b.com' })

    const { result } = renderHook(() => useAdmin(), { wrapper })
    await act(async () => {
      await result.current.bootstrap()
    })

    expect(useAdminStore.getState().isAuthenticated).toBe(true)
    expect(useAdminStore.getState().bootstrapped).toBe(true)
  })

  it('null (401) → clearSession + bootstrapped', async () => {
    ;(api.getAdminMe as unknown as Mock).mockResolvedValue(null)

    const { result } = renderHook(() => useAdmin(), { wrapper })
    await act(async () => {
      await result.current.bootstrap()
    })

    expect(useAdminStore.getState().isAuthenticated).toBe(false)
    expect(useAdminStore.getState().bootstrapped).toBe(true)
  })

  it('thrown error → clearSession', async () => {
    ;(api.getAdminMe as unknown as Mock).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useAdmin(), { wrapper })
    await act(async () => {
      await result.current.bootstrap()
    })

    expect(useAdminStore.getState().isAuthenticated).toBe(false)
    expect(useAdminStore.getState().bootstrapped).toBe(true)
  })
})
