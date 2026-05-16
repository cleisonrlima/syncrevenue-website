import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AdminApiError,
  getAdminMe,
  postAdminLogin,
  postAdminLogout,
} from '@/lib/api'
import { useAdminStore } from '@/store/useAdminStore'

export type AdminErrorKey =
  | 'admin.login.errors.invalidCredentials'
  | 'admin.login.errors.network'
  | 'admin.login.errors.unknown'

interface UseAdminApi {
  isAuthenticated: boolean
  adminId: number | null
  email: string | null
  bootstrapped: boolean
  errorKey: AdminErrorKey | null
  isSubmitting: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  bootstrap: () => Promise<void>
  clearError: () => void
}

function mapErrorKey(err: unknown): AdminErrorKey {
  if (err instanceof AdminApiError) {
    if (err.status === 401) return 'admin.login.errors.invalidCredentials'
    if (err.status === 0) return 'admin.login.errors.network'
  }
  return 'admin.login.errors.unknown'
}

export function useAdmin(): UseAdminApi {
  const navigate = useNavigate()
  const isAuthenticated = useAdminStore(state => state.isAuthenticated)
  const adminId = useAdminStore(state => state.adminId)
  const email = useAdminStore(state => state.email)
  const bootstrapped = useAdminStore(state => state.bootstrapped)
  const setSession = useAdminStore(state => state.setSession)
  const clearSession = useAdminStore(state => state.clearSession)

  const [errorKey, setErrorKey] = useState<AdminErrorKey | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const login = useCallback(
    async (loginEmail: string, password: string) => {
      if (isSubmitting) return false
      setIsSubmitting(true)
      setErrorKey(null)
      try {
        const result = await postAdminLogin({ email: loginEmail, password })
        setSession(result.data)
        navigate('/admin/dashboard', { replace: true })
        return true
      } catch (err) {
        setErrorKey(mapErrorKey(err))
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [isSubmitting, navigate, setSession]
  )

  const logout = useCallback(async () => {
    try {
      await postAdminLogout()
    } catch {
      // ignore — clearSession + navigate still runs
    } finally {
      clearSession()
      navigate('/admin/login', { replace: true })
    }
  }, [clearSession, navigate])

  const bootstrap = useCallback(async () => {
    try {
      const session = await getAdminMe()
      if (session) {
        setSession(session)
      } else {
        clearSession()
      }
    } catch {
      clearSession()
    }
  }, [clearSession, setSession])

  const clearError = useCallback(() => setErrorKey(null), [])

  return {
    isAuthenticated,
    adminId,
    email,
    bootstrapped,
    errorKey,
    isSubmitting,
    login,
    logout,
    bootstrap,
    clearError,
  }
}
