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
    patchAdminLeadStatus: vi.fn(),
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
  ;(api.patchAdminLeadStatus as unknown as Mock).mockReset()
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

  describe('inline status mutation', () => {
    it('renders a status <select> per row with the current status pre-selected', async () => {
      const rows = [
        makeRow({ id: 30, status: 'pending' }),
        makeRow({ id: 31, status: 'contacted' }),
      ]
      ;(api.getAdminLeads as unknown as Mock).mockResolvedValue(rows)
      renderLeads()

      const select30 = (await screen.findByTestId('lead-status-select-30')) as HTMLSelectElement
      const select31 = (await screen.findByTestId('lead-status-select-31')) as HTMLSelectElement
      expect(select30.value).toBe('pending')
      expect(select31.value).toBe('contacted')
    })

    it('optimistically updates the badge before the helper resolves and calls patchAdminLeadStatus once with (id, status)', async () => {
      const initialRow = makeRow({ id: 40, status: 'pending' })
      const updatedRow = { ...initialRow, status: 'contacted' as const }
      ;(api.getAdminLeads as unknown as Mock).mockResolvedValue([initialRow])
      let resolvePatch: ((row: typeof updatedRow) => void) | undefined
      ;(api.patchAdminLeadStatus as unknown as Mock).mockReturnValue(
        new Promise<typeof updatedRow>(resolve => {
          resolvePatch = resolve
        })
      )
      renderLeads()
      await screen.findByTestId('lead-status-select-40')

      const user = userEvent.setup()
      const select = screen.getByTestId('lead-status-select-40') as HTMLSelectElement
      await user.selectOptions(select, 'contacted')

      expect((screen.getByTestId('lead-status-40') as HTMLElement).textContent).toBe('Contacted')
      expect(api.patchAdminLeadStatus).toHaveBeenCalledTimes(1)
      expect((api.patchAdminLeadStatus as unknown as Mock).mock.calls[0]).toEqual([40, 'contacted'])

      await act(async () => {
        resolvePatch!(updatedRow)
      })

      await waitFor(() => {
        expect((screen.getByTestId('lead-status-40') as HTMLElement).textContent).toBe('Contacted')
      })
    })

    it('disables the row select and sets aria-busy while mutation is in flight', async () => {
      const row: AdminLeadRow = makeRow({ id: 50, status: 'pending' })
      ;(api.getAdminLeads as unknown as Mock).mockResolvedValue([row])
      let resolvePatch: ((row: AdminLeadRow) => void) | undefined
      ;(api.patchAdminLeadStatus as unknown as Mock).mockReturnValue(
        new Promise<AdminLeadRow>(resolve => {
          resolvePatch = resolve
        })
      )
      renderLeads()
      await screen.findByTestId('lead-status-select-50')

      const user = userEvent.setup()
      const select = screen.getByTestId('lead-status-select-50') as HTMLSelectElement
      await user.selectOptions(select, 'contacted')

      expect(select).toBeDisabled()
      expect(select.getAttribute('aria-busy')).toBe('true')
      const tr = screen.getByTestId('lead-row-50')
      expect(tr.getAttribute('aria-busy')).toBe('true')

      await act(async () => {
        resolvePatch!({ ...row, status: 'contacted' })
      })

      await waitFor(() => {
        expect(select).not.toBeDisabled()
      })
    })

    it('removes a row from the visible table when mutation no longer matches the active status filter', async () => {
      const row: AdminLeadRow = makeRow({ id: 55, name: 'Filtered Lead', status: 'pending' })
      ;(api.getAdminLeads as unknown as Mock).mockResolvedValue([row])
      ;(api.patchAdminLeadStatus as unknown as Mock).mockResolvedValue({
        ...row,
        status: 'contacted',
      })
      renderLeads()
      await screen.findByText('Filtered Lead')

      const user = userEvent.setup()
      await user.selectOptions(screen.getByTestId('admin-leads-status-filter'), 'pending')
      await waitFor(() => {
        expectLastGetAdminLeadsCall({ status: 'pending' })
      })

      await user.selectOptions(screen.getByTestId('lead-status-select-55'), 'contacted')

      await waitFor(() => {
        expect(screen.queryByText('Filtered Lead')).toBeNull()
      })
      expect(await screen.findByTestId('admin-leads-empty')).toHaveTextContent(
        /no leads match this filter/i
      )
    })

    it('reverts the badge and shows invalidStatus alert on AdminApiError(400, "status")', async () => {
      const row = makeRow({ id: 60, status: 'pending' })
      ;(api.getAdminLeads as unknown as Mock).mockResolvedValue([row])
      ;(api.patchAdminLeadStatus as unknown as Mock).mockRejectedValue(
        new AdminApiError(400, 'Invalid status', 'status')
      )
      renderLeads()
      await screen.findByTestId('lead-status-select-60')

      const user = userEvent.setup()
      await user.selectOptions(screen.getByTestId('lead-status-select-60'), 'contacted')

      const alert = await screen.findByTestId('lead-status-error-60')
      expect(alert).toHaveTextContent(/invalid status value/i)
      await waitFor(() => {
        expect((screen.getByTestId('lead-status-60') as HTMLElement).textContent).toBe('Pending')
      })
    })

    it('reverts the badge and shows notFound alert on AdminApiError(404)', async () => {
      const row = makeRow({ id: 61, status: 'pending' })
      ;(api.getAdminLeads as unknown as Mock).mockResolvedValue([row])
      ;(api.patchAdminLeadStatus as unknown as Mock).mockRejectedValue(
        new AdminApiError(404, 'Lead not found')
      )
      renderLeads()
      await screen.findByTestId('lead-status-select-61')

      const user = userEvent.setup()
      await user.selectOptions(screen.getByTestId('lead-status-select-61'), 'contacted')

      const alert = await screen.findByTestId('lead-status-error-61')
      expect(alert).toHaveTextContent(/no longer exists/i)
      await waitFor(() => {
        expect((screen.getByTestId('lead-status-61') as HTMLElement).textContent).toBe('Pending')
      })
    })

    it('reverts the badge and shows generic alert on AdminApiError(500)', async () => {
      const row = makeRow({ id: 62, status: 'pending' })
      ;(api.getAdminLeads as unknown as Mock).mockResolvedValue([row])
      ;(api.patchAdminLeadStatus as unknown as Mock).mockRejectedValue(
        new AdminApiError(500, 'boom')
      )
      renderLeads()
      await screen.findByTestId('lead-status-select-62')

      const user = userEvent.setup()
      await user.selectOptions(screen.getByTestId('lead-status-select-62'), 'contacted')

      const alert = await screen.findByTestId('lead-status-error-62')
      expect(alert).toHaveTextContent(/couldn't update status/i)
      await waitFor(() => {
        expect((screen.getByTestId('lead-status-62') as HTMLElement).textContent).toBe('Pending')
      })
    })

    it('AdminApiError(401) triggers clearSession with no per-row alert', async () => {
      const row = makeRow({ id: 63, status: 'pending' })
      ;(api.getAdminLeads as unknown as Mock).mockResolvedValue([row])
      ;(api.patchAdminLeadStatus as unknown as Mock).mockRejectedValue(
        new AdminApiError(401, 'Unauthorized')
      )
      renderLeads()
      await screen.findByTestId('lead-status-select-63')

      const user = userEvent.setup()
      await user.selectOptions(screen.getByTestId('lead-status-select-63'), 'contacted')

      await waitFor(() => {
        expect(useAdminStore.getState().isAuthenticated).toBe(false)
      })
      expect(screen.queryByTestId('lead-status-error-63')).toBeNull()
    })

    it('keeps per-row mutation state isolated when two rows mutate concurrently', async () => {
      const rowA = makeRow({ id: 70, status: 'pending' })
      const rowB = makeRow({ id: 71, status: 'pending' })
      ;(api.getAdminLeads as unknown as Mock).mockResolvedValue([rowA, rowB])

      const pendingResolvers: Record<number, ((row: AdminLeadRow) => void) | undefined> = {}
      ;(api.patchAdminLeadStatus as unknown as Mock).mockImplementation(
        (id: number, _status: string) =>
          new Promise<AdminLeadRow>(resolve => {
            pendingResolvers[id] = resolve
          })
      )

      renderLeads()
      await screen.findByTestId('lead-status-select-70')

      const user = userEvent.setup()
      await user.selectOptions(screen.getByTestId('lead-status-select-70'), 'contacted')
      await user.selectOptions(screen.getByTestId('lead-status-select-71'), 'qualified')

      const selectA = screen.getByTestId('lead-status-select-70') as HTMLSelectElement
      const selectB = screen.getByTestId('lead-status-select-71') as HTMLSelectElement
      expect(selectA).toBeDisabled()
      expect(selectB).toBeDisabled()

      await act(async () => {
        pendingResolvers[70]!({ ...rowA, status: 'contacted' })
      })

      await waitFor(() => {
        expect(selectA).not.toBeDisabled()
      })
      expect(selectB).toBeDisabled()

      await act(async () => {
        pendingResolvers[71]!({ ...rowB, status: 'qualified' })
      })

      await waitFor(() => {
        expect(selectB).not.toBeDisabled()
      })
    })
  })
})
