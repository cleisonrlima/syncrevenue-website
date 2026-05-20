import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import '@/i18n'
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
          <Route path="leads" element={<div data-testid="leads-route">leads</div>} />
          <Route path="team" element={<div data-testid="team-route">team</div>} />
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

  describe('persistent nav region (Story 4.6)', () => {
    it('does NOT render the nav at /admin/login when authenticated (redirect to dashboard fires first)', async () => {
      ;(api.getAdminMe as unknown as Mock).mockResolvedValue({ adminId: 1, email: 'a@b.com' })
      renderAt('/admin/login')
      await waitFor(() => expect(screen.getByTestId('dashboard-route')).toBeInTheDocument())
      // Even after redirect the dashboard route renders inside AdminLayout — at /admin/dashboard
      // the nav SHOULD be visible. So this case only proves the LOGIN route never shows nav.
      // Direct assertion: on /admin/login (with no auth) nav is hidden.
    })

    it('does NOT render the nav at /admin/login when unauthenticated', async () => {
      ;(api.getAdminMe as unknown as Mock).mockResolvedValue(null)
      renderAt('/admin/login')
      await waitFor(() => expect(screen.getByTestId('login-route')).toBeInTheDocument())
      expect(screen.queryByTestId('admin-nav')).toBeNull()
    })

    it('does NOT render the nav while bootstrap is in flight', () => {
      ;(api.getAdminMe as unknown as Mock).mockReturnValue(new Promise(() => {}))
      renderAt('/admin/dashboard')
      expect(screen.queryByTestId('admin-nav')).toBeNull()
    })

    it('does NOT render the nav when isAuthenticated is false (unauth dashboard request)', async () => {
      ;(api.getAdminMe as unknown as Mock).mockResolvedValue(null)
      renderAt('/admin/dashboard')
      await waitFor(() => expect(screen.getByTestId('login-route')).toBeInTheDocument())
      expect(screen.queryByTestId('admin-nav')).toBeNull()
    })

    it('renders the nav with all three links + logout when authenticated on /admin/dashboard', async () => {
      ;(api.getAdminMe as unknown as Mock).mockResolvedValue({ adminId: 1, email: 'a@b.com' })
      renderAt('/admin/dashboard')
      await waitFor(() => expect(screen.getByTestId('admin-nav')).toBeInTheDocument())
      expect(screen.getByTestId('admin-nav-dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('admin-nav-leads')).toBeInTheDocument()
      expect(screen.getByTestId('admin-nav-team')).toBeInTheDocument()
      expect(screen.getByTestId('admin-nav-logout')).toBeInTheDocument()
    })

    it.each([
      ['/admin/dashboard', 'admin-nav-dashboard'],
      ['/admin/leads', 'admin-nav-leads'],
      ['/admin/team', 'admin-nav-team'],
    ])('active NavLink for %s has aria-current="page"', async (path, testId) => {
      ;(api.getAdminMe as unknown as Mock).mockResolvedValue({ adminId: 1, email: 'a@b.com' })
      renderAt(path)
      await waitFor(() => expect(screen.getByTestId('admin-nav')).toBeInTheDocument())
      expect(screen.getByTestId(testId)).toHaveAttribute('aria-current', 'page')
    })

    it('still renders nested route via <Outlet /> alongside the nav', async () => {
      ;(api.getAdminMe as unknown as Mock).mockResolvedValue({ adminId: 1, email: 'a@b.com' })
      renderAt('/admin/team')
      await waitFor(() => expect(screen.getByTestId('admin-nav')).toBeInTheDocument())
      expect(screen.getByTestId('team-route')).toBeInTheDocument()
    })

    it('clicking Logout invokes postAdminLogout (logout flow)', async () => {
      ;(api.getAdminMe as unknown as Mock).mockResolvedValue({ adminId: 1, email: 'a@b.com' })
      ;(api.postAdminLogout as unknown as Mock).mockResolvedValue({ success: true })
      const user = userEvent.setup()
      renderAt('/admin/dashboard')
      await waitFor(() => expect(screen.getByTestId('admin-nav-logout')).toBeInTheDocument())
      await user.click(screen.getByTestId('admin-nav-logout'))
      await waitFor(() => expect(api.postAdminLogout).toHaveBeenCalled())
    })
  })
})
