import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import i18next from '@/i18n'
import SyncRevenue from './SyncRevenue'
import Services from './Services'

describe('SyncRevenue and Services i18n', () => {
  afterEach(async () => {
    cleanup()
    await i18next.changeLanguage('en')
  })

  it('updates SyncRevenue copy when locale changes', async () => {
    const { rerender } = render(<SyncRevenue />)

    expect(screen.getByRole('heading', { name: 'Automated Commission Reconciliation' })).toBeInTheDocument()

    await i18next.changeLanguage('pt-BR')
    rerender(<SyncRevenue />)

    expect(screen.getByRole('heading', { name: 'Reconciliação Automatizada de Comissões' })).toBeInTheDocument()
    expect(screen.getByText(/99,99% de assertividade de comissões/)).toBeInTheDocument()
  })

  it('updates Services copy when locale changes', async () => {
    const { rerender } = render(<Services />)

    expect(screen.getByRole('heading', { name: 'Complete Revenue Intelligence Suite' })).toBeInTheDocument()

    await i18next.changeLanguage('es')
    rerender(<Services />)

    expect(screen.getByRole('heading', { name: 'Suite Completa de Inteligencia de Ingresos' })).toBeInTheDocument()
    expect(screen.getByText('¿No está seguro de qué servicio necesita? Contáctenos.')).toBeInTheDocument()
  })
})
