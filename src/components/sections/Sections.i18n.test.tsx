import { afterEach, describe, expect, it, vi, type Mock } from 'vitest'
import { act, render, screen, cleanup, waitFor } from '@testing-library/react'
import i18next from '@/i18n'
import SyncRevenue from './SyncRevenue'
import Services from './Services'
import Comparison from './Comparison'
import Team from './Team'
import Security from './Security'
import ClientReferences from './ClientReferences'
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
    bio_en: 'Guides GDS operations, BSP/ARC reconciliation.',
    bio_pt: 'Orienta operações GDS, reconciliação BSP/ARC.',
    bio_es: 'Guía operaciones GDS, conciliación BSP/ARC.',
    linkedin: null,
    photo_url: null,
    order_index: 0,
    active: 1,
  },
]

describe('Section i18n', () => {
  afterEach(async () => {
    cleanup()
    await i18next.changeLanguage('en')
  })

  it('updates SyncRevenue copy when locale changes', async () => {
    const { rerender } = render(<SyncRevenue />)

    expect(screen.getByRole('heading', { name: 'Automated Commission Reconciliation' })).toBeInTheDocument()

    await act(async () => {
      await i18next.changeLanguage('pt-BR')
    })
    rerender(<SyncRevenue />)

    expect(screen.getByRole('heading', { name: 'Reconciliação Automatizada de Comissões' })).toBeInTheDocument()
    expect(screen.getByText(/99,99% de assertividade de comissões/)).toBeInTheDocument()
  })

  it('updates Services copy when locale changes', async () => {
    const { rerender } = render(<Services />)

    expect(screen.getByRole('heading', { name: 'Complete Revenue Intelligence Suite' })).toBeInTheDocument()

    await act(async () => {
      await i18next.changeLanguage('es')
    })
    rerender(<Services />)

    expect(screen.getByRole('heading', { name: 'Suite Completa de Inteligencia de Ingresos' })).toBeInTheDocument()
    expect(screen.getByText('¿No está seguro de qué servicio necesita? Contáctenos.')).toBeInTheDocument()
  })

  it('updates Comparison table copy when locale changes', async () => {
    const { rerender } = render(<Comparison />)

    expect(screen.getByRole('heading', { name: 'Stop Losing Revenue to Manual Processes' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'BSP/ARC Reconciliation' })).toBeInTheDocument()

    await act(async () => {
      await i18next.changeLanguage('pt-BR')
    })
    rerender(<Comparison />)

    expect(screen.getByRole('heading', { name: 'Pare de Perder Receita com Processos Manuais' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Reconciliação BSP/ARC' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Ferramentas Genéricas' })).toBeInTheDocument()
    expect(screen.getByText(/Não modelam fluxos de liquidação aérea/)).toBeInTheDocument()
  })

  it('updates Team member roles and bios when locale changes', async () => {
    ;(api.getPublicTeam as unknown as Mock).mockResolvedValue(teamFixture)
    useLocaleStore.setState({ locale: 'en' })
    const { rerender } = render(<Team />)

    expect(screen.getByRole('heading', { name: 'Specialists in Airline Distribution' })).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText('Airline Distribution & Commission Strategy Lead')).toBeInTheDocument()
    )

    await act(async () => {
      await i18next.changeLanguage('pt-BR')
      useLocaleStore.setState({ locale: 'pt-BR' })
    })
    rerender(<Team />)

    expect(screen.getByRole('heading', { name: 'Especialistas em Distribuição Aérea' })).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText('Liderança em Distribuição Aérea e Estratégia de Comissões')).toBeInTheDocument()
    )
    expect(screen.getByText(/operações GDS, reconciliação BSP\/ARC/)).toBeInTheDocument()
  })

  it('updates Security copy when locale changes', async () => {
    const { rerender } = render(<Security />)

    expect(screen.getByRole('heading', { name: 'Your Data is Protected' })).toBeInTheDocument()
    expect(screen.getByText(/GDS credentials never touch the website/)).toBeInTheDocument()

    await act(async () => {
      await i18next.changeLanguage('es')
    })
    rerender(<Security />)

    expect(screen.getByRole('heading', { name: 'Sus Datos Están Protegidos' })).toBeInTheDocument()
    expect(screen.getByText(/Las credenciales GDS nunca tocan el sitio web/)).toBeInTheDocument()
  })

  it('updates ClientReferences copy when locale changes', async () => {
    const { rerender } = render(<ClientReferences />)

    expect(screen.getByRole('heading', { name: 'Trusted by US Travel Agencies' })).toBeInTheDocument()
    expect(screen.getByText(/Named references are shared with approval/)).toBeInTheDocument()

    await act(async () => {
      await i18next.changeLanguage('pt-BR')
    })
    rerender(<ClientReferences />)

    expect(screen.getByRole('heading', { name: 'Confiado por Agências de Viagem nos EUA' })).toBeInTheDocument()
    expect(screen.getByText(/Referências nomeadas são compartilhadas com aprovação/)).toBeInTheDocument()
  })
})
