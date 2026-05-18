import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'
import i18next from '@/i18n'
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

const teamFixture: PublicTeamMemberRow[] = [
  {
    id: 1,
    name: 'Maria Silva',
    role_en: 'Airline Distribution & Commission Strategy Lead',
    role_pt: 'Liderança em Distribuição Aérea e Estratégia de Comissões',
    role_es: 'Liderazgo en Distribución Aérea y Estrategia de Comisiones',
    bio_en: 'Guides travel agencies through GDS operations, BSP/ARC reconciliation and commission recovery strategy across the Americas.',
    bio_pt: 'Orienta agências em operações GDS, reconciliação BSP/ARC e estratégia de recuperação de comissões.',
    bio_es: 'Guía a agencias en operaciones GDS, conciliación BSP/ARC y estrategia de recuperación de comisiones.',
    linkedin: null,
    photo_url: '/team/maria.webp',
    order_index: 0,
    active: 1,
  },
  {
    id: 2,
    name: 'Lucas Oliveira',
    role_en: 'Travel Data Integration & Automation Lead',
    role_pt: 'Liderança em Integração de Dados de Viagem e Automação',
    role_es: 'Liderazgo en Integración de Datos de Viaje y Automatización',
    bio_en: 'Builds travel data integration and revenue optimization systems.',
    bio_pt: 'Constrói integrações de dados e rotinas operacionais confiáveis para receita.',
    bio_es: 'Construye integraciones de datos y rutinas operativas confiables para ingresos.',
    linkedin: null,
    photo_url: '/team/lucas.webp',
    order_index: 1,
    active: 1,
  },
]

describe('Story 1.8 team visitor flow', () => {
  beforeEach(async () => {
    window.history.pushState({}, '', '/')
    localStorage.clear()
    useLocaleStore.setState({ locale: 'en' })
    await i18next.changeLanguage('en')
    ;(api.getPublicTeam as unknown as Mock).mockReset()
    ;(api.getPublicTeam as unknown as Mock).mockResolvedValue(teamFixture)
  })

  afterEach(async () => {
    cleanup()
    await i18next.changeLanguage('en')
    useLocaleStore.setState({ locale: 'en' })
  })

  const renderHome = () =>
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

  it('presents the Team section with translated member details before the demo ask', async () => {
    renderHome()

    const clientReferences = await waitFor(() => {
      const section = document.querySelector('#clientes')
      expect(section).toBeInTheDocument()
      return section as HTMLElement
    })
    const team = await screen.findByRole('region', {
      name: 'Sync Sirius team specialists',
    })
    const demoScheduler = await waitFor(() => {
      const section = document.querySelector('#demo-scheduler')
      expect(section).toBeInTheDocument()
      return section as HTMLElement
    })

    expect(clientReferences.compareDocumentPosition(team)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(team.compareDocumentPosition(demoScheduler)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    // Story 6.7 reshaped this headline into accent-split form.
    expect(within(team).getByRole('heading', { name: /Specialists in\s+airline distribution/i })).toBeInTheDocument()
    expect(within(team).getByRole('heading', { name: 'Maria Silva' })).toBeInTheDocument()
    expect(within(team).getByText('Airline Distribution & Commission Strategy Lead')).toBeInTheDocument()
    expect(within(team).getByText(/GDS operations, BSP\/ARC reconciliation/)).toBeInTheDocument()
    expect(within(team).getByRole('heading', { name: 'Lucas Oliveira' })).toBeInTheDocument()
    expect(within(team).getByText('Travel Data Integration & Automation Lead')).toBeInTheDocument()
    const placeholders = team.querySelectorAll('[data-team-photo-placeholder="true"]')
    expect(placeholders).toHaveLength(0)
    const photos = team.querySelectorAll('img[src^="/team/"]')
    expect(photos).toHaveLength(2)
  })

  it('updates Team member roles and bios through the real language switcher without navigating', async () => {
    const user = userEvent.setup()
    renderHome()

    const team = await screen.findByRole('region', {
      name: 'Sync Sirius team specialists',
    })
    expect(within(team).getByText('Airline Distribution & Commission Strategy Lead')).toBeInTheDocument()
    expect(within(team).getByText(/commission recovery strategy across the Americas/)).toBeInTheDocument()

    const pathBeforeLocaleChange = window.location.pathname
    await user.click(screen.getAllByRole('button', { name: 'PT-BR' })[0])

    expect(window.location.pathname).toBe(pathBeforeLocaleChange)
    expect(localStorage.getItem('i18nextLng')).toBe('pt-BR')
    const translatedTeam = await screen.findByRole('region', {
      name: 'Especialistas da equipe Sync Sirius',
    })
    expect(
      within(translatedTeam).getByRole('heading', { name: /Especialistas em\s+distribuição aérea/i }),
    ).toBeInTheDocument()
    expect(
      within(translatedTeam).getByText('Liderança em Distribuição Aérea e Estratégia de Comissões'),
    ).toBeInTheDocument()
    expect(within(translatedTeam).getByText(/operações GDS, reconciliação BSP\/ARC/)).toBeInTheDocument()
    expect(
      within(translatedTeam).getByText('Liderança em Integração de Dados de Viagem e Automação'),
    ).toBeInTheDocument()
    expect(within(translatedTeam).getByText(/rotinas operacionais confiáveis/)).toBeInTheDocument()
  })
})
