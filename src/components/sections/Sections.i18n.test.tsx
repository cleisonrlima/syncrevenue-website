import { afterEach, describe, expect, it } from 'vitest'
import { act, render, screen, cleanup } from '@testing-library/react'
import i18next from '@/i18n'
import SyncRevenue from './SyncRevenue'
import Services from './Services'
import Comparison from './Comparison'

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
})
