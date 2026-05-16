import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import '@/i18n'
import Login from './Login'
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

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
}

beforeEach(() => {
  navigateMock.mockReset()
  ;(api.postAdminLogin as unknown as Mock).mockReset()
  useAdminStore.setState({
    isAuthenticated: false,
    adminId: null,
    email: null,
    bootstrapped: false,
  })
})

describe('Login page', () => {
  it('renders email + password labels + submit', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password|senha|contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in|entrar|iniciar sesión/i })).toBeInTheDocument()
  })

  it('submits credentials + triggers navigate on success', async () => {
    ;(api.postAdminLogin as unknown as Mock).mockResolvedValue({
      success: true,
      data: { adminId: 1, email: 'admin@b.com' },
    })

    renderLogin()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/email/i), 'admin@b.com')
    await user.type(screen.getByLabelText(/password|senha|contraseña/i), 'secret')
    await user.click(screen.getByRole('button', { name: /sign in|entrar|iniciar sesión/i }))

    await waitFor(() => {
      expect(api.postAdminLogin).toHaveBeenCalledWith({ email: 'admin@b.com', password: 'secret' })
    })
    expect(navigateMock).toHaveBeenCalledWith('/admin/dashboard', { replace: true })
  })

  it('renders invalidCredentials error on 401', async () => {
    ;(api.postAdminLogin as unknown as Mock).mockRejectedValue(
      new AdminApiError(401, 'Invalid credentials')
    )

    renderLogin()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/email/i), 'admin@b.com')
    await user.type(screen.getByLabelText(/password|senha|contraseña/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in|entrar|iniciar sesión/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/invalid credentials/i)
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('disables submit while in-flight', async () => {
    let resolveLogin: (value: unknown) => void
    ;(api.postAdminLogin as unknown as Mock).mockReturnValue(
      new Promise(resolve => {
        resolveLogin = resolve
      })
    )

    renderLogin()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/email/i), 'admin@b.com')
    await user.type(screen.getByLabelText(/password|senha|contraseña/i), 'x')
    const submit = screen.getByRole('button', { name: /sign in|entrar|iniciar sesión/i })

    fireEvent.click(submit)
    await waitFor(() => expect(submit).toBeDisabled())

    resolveLogin!({ success: true, data: { adminId: 1, email: 'admin@b.com' } })
  })

  it('clears error when user edits a field', async () => {
    ;(api.postAdminLogin as unknown as Mock).mockRejectedValue(
      new AdminApiError(401, 'Invalid credentials')
    )

    renderLogin()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/email/i), 'admin@b.com')
    await user.type(screen.getByLabelText(/password|senha|contraseña/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in|entrar|iniciar sesión/i }))
    await screen.findByRole('alert')

    await user.type(screen.getByLabelText(/email/i), 'x')
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
