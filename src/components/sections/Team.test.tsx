import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Team from './Team'
import { useLocaleStore } from '@/store/useLocaleStore'
import type { PublicTeamMemberRow } from '@/lib/api'

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    getPublicTeam: vi.fn(),
  }
})

const api = await import('@/lib/api')

const tMock = vi.fn(
  (
    key: string,
    options?: { defaultValue?: string; returnObjects?: boolean; name?: string }
  ) => {
    if (key === 'team.linkedinAriaLabel') {
      const name = options?.name ?? ''
      return `View ${name} on LinkedIn`
    }
    return options?.defaultValue ?? key
  }
)

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: tMock }),
}))

function makeRow(overrides: Partial<PublicTeamMemberRow> = {}): PublicTeamMemberRow {
  return {
    id: 1,
    name: 'Team Member Name',
    role_en: 'Airline Distribution Lead',
    role_pt: 'Líder de Distribuição Aérea',
    role_es: 'Líder de Distribución Aérea',
    bio_en: 'Guides GDS operations, BSP reconciliation, and commission recovery programs.',
    bio_pt: 'Orienta operações de GDS, conciliação BSP e programas de recuperação de comissões.',
    bio_es: 'Guía operaciones de GDS, conciliación BSP y programas de recuperación de comisiones.',
    linkedin: null,
    photo_url: null,
    order_index: 0,
    active: 1,
    ...overrides,
  }
}

beforeEach(() => {
  tMock.mockClear()
  ;(api.getPublicTeam as unknown as Mock).mockReset()
  useLocaleStore.setState({ locale: 'en' })
})

describe('Team (public section)', () => {
  it('renders the region header even before data arrives', async () => {
    ;(api.getPublicTeam as unknown as Mock).mockResolvedValue([])
    render(<Team />)
    const section = screen.getByRole('region', { name: 'Sync Sirius team specialists' })
    // Story 6.7 renamed `team` → `equipe` to match Epic 6 PT-BR-first id vocabulary.
    expect(section).toHaveAttribute('id', 'equipe')
    await waitFor(() => expect(api.getPublicTeam).toHaveBeenCalled())
  })

  it('renders member cards with EN role/bio by default', async () => {
    ;(api.getPublicTeam as unknown as Mock).mockResolvedValue([
      makeRow({
        id: 1,
        name: 'Maria Silva',
        photo_url: '/team/maria.webp',
        linkedin: 'https://www.linkedin.com/in/maria',
      }),
      makeRow({
        id: 2,
        name: 'Lucas Oliveira',
        role_en: 'Travel Data Automation Lead',
        bio_en: 'Builds travel data integration and revenue optimization systems.',
      }),
    ])
    const { container } = render(<Team />)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Maria Silva' })).toBeInTheDocument())
    expect(screen.getByText('Airline Distribution Lead')).toBeInTheDocument()
    expect(screen.getByText(/Guides GDS operations/)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'View Maria Silva on LinkedIn' })
    expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/maria')
    expect(container.querySelector('[data-team-photo-placeholder="true"]')).toBeInTheDocument()
  })

  it('renders no grid when API returns an empty array', async () => {
    ;(api.getPublicTeam as unknown as Mock).mockResolvedValue([])
    const { container } = render(<Team />)
    await waitFor(() => expect(api.getPublicTeam).toHaveBeenCalled())
    expect(container.querySelector('[data-team-grid="true"]')).not.toBeInTheDocument()
    expect(container.querySelectorAll('article')).toHaveLength(0)
  })

  it('switches role/bio when locale changes to pt-BR', async () => {
    ;(api.getPublicTeam as unknown as Mock).mockResolvedValue([
      makeRow({ id: 1, name: 'Maria Silva' }),
    ])
    render(<Team />)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Maria Silva' })).toBeInTheDocument())
    useLocaleStore.setState({ locale: 'pt-BR' })
    await waitFor(() => expect(screen.getByText('Líder de Distribuição Aérea')).toBeInTheDocument())
    expect(screen.getByText(/conciliação BSP/)).toBeInTheDocument()
  })

  it('falls back to header-only render on network failure', async () => {
    ;(api.getPublicTeam as unknown as Mock).mockRejectedValue(new Error('boom'))
    const { container } = render(<Team />)
    await waitFor(() => expect(api.getPublicTeam).toHaveBeenCalled())
    expect(container.querySelector('[data-team-grid="true"]')).not.toBeInTheDocument()
  })
})
