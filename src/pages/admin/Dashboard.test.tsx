import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import '@/i18n'
import Dashboard from './Dashboard'
import { useAdminStore } from '@/store/useAdminStore'
import { AdminApiError, type AdminDashboardStats } from '@/lib/api'

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    getAdminDashboardStats: vi.fn(),
  }
})

const api = await import('@/lib/api')

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  )
}

const sampleStats: AdminDashboardStats = {
  totalLeads: 12,
  pendingLeads: 5,
  leadsThisWeek: 3,
  leadsByLocale: { en: 7, 'pt-BR': 3, es: 2 },
}

beforeEach(() => {
  ;(api.getAdminDashboardStats as unknown as Mock).mockReset()
  useAdminStore.setState({
    isAuthenticated: true,
    adminId: 1,
    email: 'admin@example.com',
    bootstrapped: true,
  })
})

describe('Dashboard (Story 4.6)', () => {
  it('renders skeleton loaders while getAdminDashboardStats is pending', () => {
    ;(api.getAdminDashboardStats as unknown as Mock).mockReturnValue(new Promise(() => {}))
    renderDashboard()
    expect(screen.getByTestId('admin-dashboard-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('admin-dashboard-stats')).toBeNull()
  })

  it('renders all four cards with correct values when the mock resolves', async () => {
    ;(api.getAdminDashboardStats as unknown as Mock).mockResolvedValue(sampleStats)
    renderDashboard()
    await waitFor(() =>
      expect(screen.getByTestId('admin-dashboard-stats')).toBeInTheDocument()
    )
    expect(screen.getByTestId('admin-dashboard-card-total')).toHaveTextContent('12')
    expect(screen.getByTestId('admin-dashboard-card-pending')).toHaveTextContent('5')
    expect(screen.getByTestId('admin-dashboard-card-thisweek')).toHaveTextContent('3')
    expect(screen.getByTestId('admin-dashboard-locale-en')).toHaveTextContent('7')
    expect(screen.getByTestId('admin-dashboard-locale-pt-BR')).toHaveTextContent('3')
    expect(screen.getByTestId('admin-dashboard-locale-es')).toHaveTextContent('2')
  })

  it('renders three locale sub-rows even when one locale has zero', async () => {
    ;(api.getAdminDashboardStats as unknown as Mock).mockResolvedValue({
      ...sampleStats,
      leadsByLocale: { en: 1, 'pt-BR': 0, es: 0 },
    })
    renderDashboard()
    await waitFor(() =>
      expect(screen.getByTestId('admin-dashboard-stats')).toBeInTheDocument()
    )
    expect(screen.getByTestId('admin-dashboard-locale-en')).toHaveTextContent('1')
    expect(screen.getByTestId('admin-dashboard-locale-pt-BR')).toHaveTextContent('0')
    expect(screen.getByTestId('admin-dashboard-locale-es')).toHaveTextContent('0')
  })

  it('renders role="alert" + retry button on rejection', async () => {
    ;(api.getAdminDashboardStats as unknown as Mock).mockRejectedValue(
      new AdminApiError(500, 'boom')
    )
    renderDashboard()
    await waitFor(() =>
      expect(screen.getByTestId('admin-dashboard-error')).toBeInTheDocument()
    )
    expect(screen.getByTestId('admin-dashboard-retry')).toBeInTheDocument()
  })

  it('clicking retry invokes getAdminDashboardStats again', async () => {
    ;(api.getAdminDashboardStats as unknown as Mock)
      .mockRejectedValueOnce(new AdminApiError(500, 'boom'))
      .mockResolvedValueOnce(sampleStats)
    const user = userEvent.setup()
    renderDashboard()
    await waitFor(() =>
      expect(screen.getByTestId('admin-dashboard-error')).toBeInTheDocument()
    )
    await user.click(screen.getByTestId('admin-dashboard-retry'))
    await waitFor(() =>
      expect(screen.getByTestId('admin-dashboard-stats')).toBeInTheDocument()
    )
    expect((api.getAdminDashboardStats as unknown as Mock).mock.calls.length).toBe(2)
  })

  it('on 401 calls useAdminStore.clearSession()', async () => {
    const clearSession = vi.fn()
    useAdminStore.setState({ clearSession })
    ;(api.getAdminDashboardStats as unknown as Mock).mockRejectedValue(
      new AdminApiError(401, 'Unauthorized')
    )
    renderDashboard()
    await waitFor(() => expect(clearSession).toHaveBeenCalled())
  })

  it('does NOT render an in-page logout button (regression guard — moved to nav)', async () => {
    ;(api.getAdminDashboardStats as unknown as Mock).mockResolvedValue(sampleStats)
    renderDashboard()
    await waitFor(() =>
      expect(screen.getByTestId('admin-dashboard-stats')).toBeInTheDocument()
    )
    expect(screen.queryByTestId('admin-logout')).toBeNull()
    expect(screen.queryByTestId('admin-dashboard-email')).toBeNull()
  })

  it('aborts fetch on unmount (no act warnings)', async () => {
    ;(api.getAdminDashboardStats as unknown as Mock).mockReturnValue(new Promise(() => {}))
    const { unmount } = renderDashboard()
    await act(async () => {
      unmount()
    })
  })
})
