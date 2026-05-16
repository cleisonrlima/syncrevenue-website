import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { render, screen, waitFor, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import '@/i18n'
import Leads from './Leads'
import { useAdminStore } from '@/store/useAdminStore'
import { AdminApiError, type AdminLeadRow } from '@/lib/api'

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    getAdminLeads: vi.fn(),
  }
})

const api = await import('@/lib/api')

function renderLeads() {
  return render(
    <MemoryRouter>
      <Leads />
    </MemoryRouter>
  )
}

function expectLastGetAdminLeadsCall(filter: Record<string, unknown>) {
  const calls = (api.getAdminLeads as unknown as Mock).mock.calls
  const lastCall = calls[calls.length - 1]
  expect(lastCall[0]).toEqual(filter)
  expect(lastCall[1]?.signal).toBeInstanceOf(AbortSignal)
}

function makeRow(overrides: Partial<AdminLeadRow> = {}): AdminLeadRow {
  return {
    id: 1,
    name: 'Alice Example',
    company: 'AcmeCo',
    email: 'alice@example.com',
    phone: null,
    role: 'Owner',
    gds: 'Amadeus',
    message: 'Short note',
    locale: 'en',
    status: 'pending',
    created_at: '2026-05-16T12:00:00.000Z',
    updated_at: '2026-05-16T12:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  ;(api.getAdminLeads as unknown as Mock).mockReset()
  useAdminStore.setState({
    isAuthenticated: true,
    adminId: 1,
    email: 'admin@example.com',
    bootstrapped: true,
  })
})

describe('Leads page', () => {
  it('renders skeleton rows while initial request is pending and fires getAdminLeads() once', async () => {
    let resolveRequest: ((rows: AdminLeadRow[]) => void) | undefined
    ;(api.getAdminLeads as unknown as Mock).mockReturnValue(
      new Promise<AdminLeadRow[]>(resolve => {
        resolveRequest = resolve
      })
    )

    renderLeads()
    expect(screen.getByTestId('admin-leads-loading')).toBeInTheDocument()
    expect(api.getAdminLeads).toHaveBeenCalledTimes(1)
    expectLastGetAdminLeadsCall({})

    await act(async () => {
      resolveRequest!([])
    })
  })

  it('renders populated rows with all expected columns', async () => {
    const rows = [
      makeRow({ id: 10, name: 'Alice EN', locale: 'en', status: 'pending', email: 'alice@a.com', company: 'A' }),
      makeRow({ id: 11, name: 'Bruno PT', locale: 'pt-BR', status: 'contacted', email: 'bruno@b.com', company: 'B' }),
      makeRow({ id: 12, name: 'Diego ES', locale: 'es', status: 'qualified', email: 'diego@d.com', company: 'D' }),
    ]
    ;(api.getAdminLeads as unknown as Mock).mockResolvedValue(rows)
    renderLeads()

    const table = await screen.findByTestId('admin-leads-table')
    const tbody = table.querySelector('tbody')!
    expect(tbody.querySelectorAll('tr')).toHaveLength(3)
    expect(within(table).getByText('Alice EN')).toBeInTheDocument()
    expect(within(table).getByText('Bruno PT')).toBeInTheDocument()
    expect(within(table).getByText('Diego ES')).toBeInTheDocument()
    expect(within(table).getByText('PT-BR')).toBeInTheDocument()
  })

  it('renders status badges with correct color classes per status', async () => {
    const rows = [
      makeRow({ id: 21, status: 'pending' }),
      makeRow({ id: 22, status: 'contacted' }),
      makeRow({ id: 23, status: 'qualified' }),
    ]
    ;(api.getAdminLeads as unknown as Mock).mockResolvedValue(rows)
    renderLeads()

    await screen.findByTestId('admin-leads-table')
    expect(screen.getByTestId('lead-status-21').className).toContain('bg-amber-100')
    expect(screen.getByTestId('lead-status-21').className).toContain('text-amber-800')
    expect(screen.getByTestId('lead-status-22').className).toContain('bg-blue-100')
    expect(screen.getByTestId('lead-status-23').className).toContain('bg-green-100')
  })

  it('changing locale filter calls getAdminLeads with locale only', async () => {
    ;(api.getAdminLeads as unknown as Mock).mockResolvedValue([])
    renderLeads()
    await screen.findByTestId('admin-leads-empty')

    const user = userEvent.setup()
    const localeSelect = screen.getByTestId('admin-leads-locale-filter') as HTMLSelectElement
    await user.selectOptions(localeSelect, 'pt-BR')

    await waitFor(() => {
      expectLastGetAdminLeadsCall({ locale: 'pt-BR' })
    })
  })

  it('changing status filter calls getAdminLeads with status only', async () => {
    ;(api.getAdminLeads as unknown as Mock).mockResolvedValue([])
    renderLeads()
    await screen.findByTestId('admin-leads-empty')

    const user = userEvent.setup()
    await user.selectOptions(screen.getByTestId('admin-leads-status-filter'), 'pending')

    await waitFor(() => {
      expectLastGetAdminLeadsCall({ status: 'pending' })
    })
  })

  it('combining locale + status filters calls getAdminLeads with both', async () => {
    ;(api.getAdminLeads as unknown as Mock).mockResolvedValue([])
    renderLeads()
    await screen.findByTestId('admin-leads-empty')

    const user = userEvent.setup()
    await user.selectOptions(screen.getByTestId('admin-leads-locale-filter'), 'pt-BR')
    await user.selectOptions(screen.getByTestId('admin-leads-status-filter'), 'pending')

    await waitFor(() => {
      expectLastGetAdminLeadsCall({ locale: 'pt-BR', status: 'pending' })
    })
  })

  it('empty unfiltered response shows no-leads-yet text WITHOUT Clear filters button', async () => {
    ;(api.getAdminLeads as unknown as Mock).mockResolvedValue([])
    renderLeads()

    const empty = await screen.findByTestId('admin-leads-empty')
    expect(empty).toHaveTextContent(/no leads yet/i)
    expect(screen.queryByTestId('admin-leads-clear-filters')).toBeNull()
  })

  it('empty filtered response shows filtered text WITH Clear filters button; clicking resets selects', async () => {
    ;(api.getAdminLeads as unknown as Mock).mockResolvedValue([])
    renderLeads()
    await screen.findByTestId('admin-leads-empty')

    const user = userEvent.setup()
    await user.selectOptions(screen.getByTestId('admin-leads-locale-filter'), 'pt-BR')
    await user.selectOptions(screen.getByTestId('admin-leads-status-filter'), 'pending')

    await waitFor(() => {
      expectLastGetAdminLeadsCall({ locale: 'pt-BR', status: 'pending' })
    })

    const empty = await screen.findByTestId('admin-leads-empty')
    expect(empty).toHaveTextContent(/no leads match this filter/i)

    const clear = screen.getByTestId('admin-leads-clear-filters')
    await user.click(clear)

    const localeSelect = screen.getByTestId('admin-leads-locale-filter') as HTMLSelectElement
    const statusSelect = screen.getByTestId('admin-leads-status-filter') as HTMLSelectElement
    expect(localeSelect.value).toBe('all')
    expect(statusSelect.value).toBe('all')
    await waitFor(() => {
      expectLastGetAdminLeadsCall({})
    })
  })

  it('non-401 AdminApiError shows error block + Retry; clicking Retry re-fires the request', async () => {
    ;(api.getAdminLeads as unknown as Mock)
      .mockRejectedValueOnce(new AdminApiError(500, 'boom'))
      .mockResolvedValueOnce([makeRow({ id: 99 })])

    renderLeads()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/failed to load leads/i)

    const user = userEvent.setup()
    await user.click(screen.getByTestId('admin-leads-retry'))

    await screen.findByTestId('admin-leads-table')
    expect(api.getAdminLeads).toHaveBeenCalledTimes(2)
  })

  it('401 triggers session clear; error block does NOT swallow the 401', async () => {
    ;(api.getAdminLeads as unknown as Mock).mockRejectedValue(new AdminApiError(401, 'Unauthorized'))
    renderLeads()

    await waitFor(() => {
      expect(useAdminStore.getState().isAuthenticated).toBe(false)
    })
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByTestId('admin-leads-table')).toBeNull()
  })
})
