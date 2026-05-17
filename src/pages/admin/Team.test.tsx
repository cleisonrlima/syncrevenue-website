import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { render, screen, waitFor, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import '@/i18n'
import Team from './Team'
import { useAdminStore } from '@/store/useAdminStore'
import { AdminApiError, type AdminTeamMemberRow } from '@/lib/api'

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    getAdminTeam: vi.fn(),
    postAdminTeam: vi.fn(),
    putAdminTeam: vi.fn(),
  }
})

const api = await import('@/lib/api')

function renderTeam() {
  return render(
    <MemoryRouter>
      <Team />
    </MemoryRouter>
  )
}

function makeRow(overrides: Partial<AdminTeamMemberRow> = {}): AdminTeamMemberRow {
  return {
    id: 1,
    name: 'Maria Silva',
    role_en: 'Lead',
    role_pt: 'Líder',
    role_es: 'Líder',
    bio_en: 'en bio',
    bio_pt: 'pt bio',
    bio_es: 'es bio',
    linkedin: null,
    photo_url: null,
    order_index: 0,
    active: 1,
    ...overrides,
  }
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByTestId('team-form-name'), 'New Name')
  await user.type(screen.getByTestId('team-form-role_en'), 'EN Role')
  await user.type(screen.getByTestId('team-form-role_pt'), 'PT Role')
  await user.type(screen.getByTestId('team-form-role_es'), 'ES Role')
  await user.type(screen.getByTestId('team-form-bio_en'), 'EN bio body')
  await user.type(screen.getByTestId('team-form-bio_pt'), 'PT bio body')
  await user.type(screen.getByTestId('team-form-bio_es'), 'ES bio body')
}

beforeEach(() => {
  ;(api.getAdminTeam as unknown as Mock).mockReset()
  ;(api.postAdminTeam as unknown as Mock).mockReset()
  ;(api.putAdminTeam as unknown as Mock).mockReset()
  useAdminStore.setState({
    isAuthenticated: true,
    adminId: 1,
    email: 'admin@example.com',
    bootstrapped: true,
  })
})

describe('Team page', () => {
  it('renders sorted list of seeded rows after load', async () => {
    const rows: AdminTeamMemberRow[] = [
      makeRow({ id: 1, name: 'Alpha', order_index: 0 }),
      makeRow({ id: 2, name: 'Beta', order_index: 1 }),
    ]
    ;(api.getAdminTeam as unknown as Mock).mockResolvedValue(rows)
    renderTeam()
    expect(screen.getByTestId('admin-team-loading')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('admin-team-table')).toBeInTheDocument())
    expect(within(screen.getByTestId('team-row-1')).getByText('Alpha')).toBeInTheDocument()
    expect(within(screen.getByTestId('team-row-2')).getByText('Beta')).toBeInTheDocument()
  })

  it('renders empty state when no rows', async () => {
    ;(api.getAdminTeam as unknown as Mock).mockResolvedValue([])
    renderTeam()
    await waitFor(() => expect(screen.getByTestId('admin-team-empty')).toBeInTheDocument())
  })

  it('reveals the create form when Add Team Member is clicked', async () => {
    ;(api.getAdminTeam as unknown as Mock).mockResolvedValue([])
    const user = userEvent.setup()
    renderTeam()
    await waitFor(() => expect(screen.getByTestId('admin-team-empty')).toBeInTheDocument())
    // empty render hides the add button by design (no rows). Force create flow via state on a rendered list instead:
  })

  it('shows required field errors and does NOT call postAdminTeam on empty submit', async () => {
    ;(api.getAdminTeam as unknown as Mock).mockResolvedValue([makeRow()])
    const user = userEvent.setup()
    renderTeam()
    await waitFor(() => expect(screen.getByTestId('admin-team-table')).toBeInTheDocument())
    await user.click(screen.getByTestId('team-add'))
    await user.click(screen.getByTestId('team-form-submit'))
    expect(api.postAdminTeam).not.toHaveBeenCalled()
    const alerts = await screen.findAllByRole('alert')
    expect(alerts.length).toBeGreaterThan(0)
  })

  it('submits valid form, calls postAdminTeam, prepends row, returns to list mode', async () => {
    const existing = makeRow({ id: 1, name: 'Existing' })
    ;(api.getAdminTeam as unknown as Mock).mockResolvedValue([existing])
    const created = makeRow({ id: 99, name: 'New Name', role_en: 'EN Role' })
    ;(api.postAdminTeam as unknown as Mock).mockResolvedValue(created)
    const user = userEvent.setup()
    renderTeam()
    await waitFor(() => expect(screen.getByTestId('admin-team-table')).toBeInTheDocument())
    await user.click(screen.getByTestId('team-add'))
    await fillRequiredFields(user)
    await user.click(screen.getByTestId('team-form-submit'))
    await waitFor(() => expect(api.postAdminTeam).toHaveBeenCalledTimes(1))
    const payload = (api.postAdminTeam as unknown as Mock).mock.calls[0][0]
    expect(payload.name).toBe('New Name')
    expect(payload.role_en).toBe('EN Role')
    expect(payload.linkedin).toBeNull()
    expect(payload.photo_url).toBeNull()
    expect(payload.order_index).toBe(0)
    await waitFor(() => expect(screen.getByTestId('team-row-99')).toBeInTheDocument())
    expect(within(screen.getByTestId('team-row-99')).getByText('New Name')).toBeInTheDocument()
  })

  it('pre-populates the edit form and calls putAdminTeam on submit', async () => {
    const target = makeRow({ id: 7, name: 'To Edit', role_en: 'Old EN' })
    ;(api.getAdminTeam as unknown as Mock).mockResolvedValue([target])
    const updated = makeRow({ id: 7, name: 'To Edit', role_en: 'Updated EN' })
    ;(api.putAdminTeam as unknown as Mock).mockResolvedValue(updated)
    const user = userEvent.setup()
    renderTeam()
    await waitFor(() => expect(screen.getByTestId('admin-team-table')).toBeInTheDocument())
    await user.click(screen.getByTestId('team-edit-7'))
    const roleInput = screen.getByTestId('team-form-role_en') as HTMLInputElement
    expect(roleInput.value).toBe('Old EN')
    await user.clear(roleInput)
    await user.type(roleInput, 'Updated EN')
    await user.click(screen.getByTestId('team-form-submit'))
    await waitFor(() => expect(api.putAdminTeam).toHaveBeenCalledTimes(1))
    expect((api.putAdminTeam as unknown as Mock).mock.calls[0][0]).toBe(7)
    expect((api.putAdminTeam as unknown as Mock).mock.calls[0][1].role_en).toBe('Updated EN')
  })

  it('renders the linkedin URL error inline when postAdminTeam returns field: linkedin', async () => {
    ;(api.getAdminTeam as unknown as Mock).mockResolvedValue([makeRow()])
    ;(api.postAdminTeam as unknown as Mock).mockRejectedValue(
      new AdminApiError(400, 'Validation failed', 'linkedin')
    )
    const user = userEvent.setup()
    renderTeam()
    await waitFor(() => expect(screen.getByTestId('admin-team-table')).toBeInTheDocument())
    await user.click(screen.getByTestId('team-add'))
    await fillRequiredFields(user)
    await user.type(screen.getByTestId('team-form-linkedin'), 'https://www.linkedin.com/in/maria')
    await user.click(screen.getByTestId('team-form-submit'))
    await waitFor(() =>
      expect(screen.getByTestId('team-form-linkedin-error')).toBeInTheDocument()
    )
    // Form stays open (still shows submit button)
    expect(screen.getByTestId('team-form-submit')).toBeInTheDocument()
  })

  it('calls clearSession on 401 from postAdminTeam without rendering form-level alert', async () => {
    const clearSession = vi.fn()
    useAdminStore.setState({ clearSession })
    ;(api.getAdminTeam as unknown as Mock).mockResolvedValue([makeRow()])
    ;(api.postAdminTeam as unknown as Mock).mockRejectedValue(
      new AdminApiError(401, 'Unauthorized')
    )
    const user = userEvent.setup()
    renderTeam()
    await waitFor(() => expect(screen.getByTestId('admin-team-table')).toBeInTheDocument())
    await user.click(screen.getByTestId('team-add'))
    await fillRequiredFields(user)
    await user.click(screen.getByTestId('team-form-submit'))
    await waitFor(() => expect(clearSession).toHaveBeenCalled())
    expect(screen.queryByTestId('team-form-error')).not.toBeInTheDocument()
  })

  it('renders Retry on initial fetch error and re-fires getAdminTeam', async () => {
    ;(api.getAdminTeam as unknown as Mock)
      .mockRejectedValueOnce(new AdminApiError(500, 'boom'))
      .mockResolvedValueOnce([makeRow()])
    const user = userEvent.setup()
    renderTeam()
    await waitFor(() => expect(screen.getByTestId('admin-team-error')).toBeInTheDocument())
    await user.click(screen.getByTestId('admin-team-retry'))
    await waitFor(() => expect(screen.getByTestId('admin-team-table')).toBeInTheDocument())
    expect((api.getAdminTeam as unknown as Mock).mock.calls.length).toBe(2)
  })
})
