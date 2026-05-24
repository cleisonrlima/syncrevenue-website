// Patterns updated by Story 5.12 — see _bmad-output/test-artifacts/test-design/test-design-epic-5-v2.md
// (NG2: pre-existing flakes — RTL `waitFor` polled the DOM at a fixed interval and timed out
// under full-suite CPU contention. `findBy*` queries retry after every React effect flush and
// match the lazy-imported section the moment it commits.)
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'
import i18next from '@/i18n'
import { useLocaleStore } from '@/store/useLocaleStore'

const lazySectionWait = { timeout: 5000 }

describe('Story 1.7 comparison visitor flow', () => {
  beforeEach(async () => {
    window.history.pushState({}, '', '/')
    localStorage.clear()
    useLocaleStore.setState({ locale: 'en' })
    await i18next.changeLanguage('en')
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

  it('presents Comparison between Services and Security with generic alternatives only', async () => {
    renderHome()

    const services = await screen.findByRole(
      'region',
      { name: 'Complete Revenue Intelligence Suite' },
      { timeout: 6000 },
    )
    const comparison = await screen.findByRole(
      'region',
      { name: 'SyncRevenue comparison against manual and generic tools' },
      { timeout: 6000 },
    )
    const security = await screen.findByRole(
      'region',
      { name: 'Your Data is Protected' },
      { timeout: 6000 },
    )

    expect(services.compareDocumentPosition(comparison)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(comparison.compareDocumentPosition(security)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)

    const comparisonTable = within(comparison).getByRole('table', {
      name: 'SyncRevenue comparison against manual and generic tools',
    })

    ;['Feature', 'SyncRevenue', 'Manual / Legacy Tools', 'Generic Tools'].forEach(header => {
      expect(within(comparisonTable).getByRole('columnheader', { name: header })).toBeInTheDocument()
    })
    ;[
      'BSP/ARC Reconciliation',
      'Debit Memo Dispute Management',
      'Multi-GDS Integration',
      'Real-Time Commission Reporting',
      'Automated Audit Trail',
    ].forEach(rowLabel => {
      expect(within(comparisonTable).getByRole('rowheader', { name: rowLabel })).toBeInTheDocument()
    })
    ;[
      'Amadeus Agency360',
      'Sabre Red 360',
      'TravelWorks',
      'MIDOCO',
      'QuickBooks',
      'Excel',
    ].forEach(competitorName => {
      expect(comparison.textContent).not.toContain(competitorName)
    })
  })

  it('updates all comparison table content through the real language switcher', async () => {
    const user = userEvent.setup()
    renderHome()

    expect(
      await screen.findByRole('heading', { name: 'Stop Losing Revenue to Manual Processes' }, lazySectionWait),
    ).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Generic Tools' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'BSP/ARC Reconciliation' })).toBeInTheDocument()
    expect(screen.getByText(/Does not model airline settlement workflows/)).toBeInTheDocument()

    const pathBeforeLocaleChange = window.location.pathname
    await user.click(screen.getAllByRole('button', { name: 'EN' })[0])
    await user.click(screen.getByRole('menuitemradio', { name: 'PT-BR' }))

    expect(window.location.pathname).toBe(pathBeforeLocaleChange)
    expect(localStorage.getItem('i18nextLng')).toBe('pt-BR')
    expect(
      await screen.findByRole('heading', { name: 'Pare de Perder Receita com Processos Manuais' }, lazySectionWait),
    ).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Ferramentas Genéricas' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Reconciliação BSP/ARC' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Gestão de Disputas de Débitos' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Integração Multi-GDS' })).toBeInTheDocument()
    expect(
      screen.getByRole('rowheader', { name: 'Relatórios de Comissão em Tempo Real' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Trilha de Auditoria Automatizada' })).toBeInTheDocument()
    expect(screen.getByText(/Não modelam fluxos de liquidação aérea/)).toBeInTheDocument()
    expect(screen.getByText(/Exigem processos de tarefas customizados/)).toBeInTheDocument()
    expect(screen.getByText(/Guardam anexos ou notas sem rastreabilidade/)).toBeInTheDocument()
  })
})
