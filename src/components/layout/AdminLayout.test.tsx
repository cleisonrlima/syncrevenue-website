import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { useAdminStore } from '@/store/useAdminStore'

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    getAdminMe: vi.fn(),
    postAdminLogin: vi.fn(),
    postAdminLogout: vi.fn(),
  }
})

const api = await import('@/lib/api')

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="login" element={<div data-testid="login-route">login</div>} />
          <Route path="dashboard" element={<div data-testid="dashboard-route">dashboard</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  ;(api.getAdminMe as unknown as Mock).mockReset()
  useAdminStore.setState({
    isAuthenticated: false,
    adminId: null,
    email: null,
    bootstrapped: false,
  })
})

describe('AdminLayout', () => {
  it('renders loading state before bootstrap resolves', () => {
    ;(api.getAdminMe as unknown as Mock).mockReturnValue(new Promise(() => {}))
    renderAt('/admin/dashboard')
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByTestId('dashboard-route')).toBeNull()
  })

  it('redirects unauthenticated users from /admin/dashboard to /admin/login', async () => {
    ;(api.getAdminMe as unknown as Mock).mockResolvedValue(null)
    renderAt('/admin/dashboard')
    await waitFor(() => expect(screen.getByTestId('login-route')).toBeInTheDocument())
    expect(screen.queryByTestId('dashboard-route')).toBeNull()
  })

  it('renders outlet (dashboard) when bootstrap returns session', async () => {
    ;(api.getAdminMe as unknown as Mock).mockResolvedValue({ adminId: 1, email: 'a@b.com' })
    renderAt('/admin/dashboard')
    await waitFor(() => expect(screen.getByTestId('dashboard-route')).toBeInTheDocument())
  })

  it('redirects authenticated users from /admin/login to /admin/dashboard', async () => {
    ;(api.getAdminMe as unknown as Mock).mockResolvedValue({ adminId: 1, email: 'a@b.com' })
    renderAt('/admin/login')
    await waitFor(() => expect(screen.getByTestId('dashboard-route')).toBeInTheDocument())
  })

  it('strips public SEO meta tags on mount', async () => {
    ;(api.getAdminMe as unknown as Mock).mockResolvedValue(null)
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'description')
    meta.setAttribute('content', 'public')
    document.head.appendChild(meta)
    renderAt('/admin/login')
    await waitFor(() => expect(document.querySelector('meta[name="description"]')).toBeNull())
  })
})
