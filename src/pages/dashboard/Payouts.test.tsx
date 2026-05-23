import { afterEach, describe, it, expect, beforeAll } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Payouts from './Payouts'
import i18next from '@/i18n'
import { useLocaleStore } from '@/store/useLocaleStore'

/**
 * Story 7.3 (AC 3 + AC 6): Coverage for the Payouts page.
 *
 * Asserts the structural contract of the Figma port:
 *   - The page mounts under `<DashboardLayout>` without crashing.
 *   - The "Agent Payouts" page heading renders.
 *   - The default `All Payouts` tab renders all seven mock rows.
 *   - Switching to `Failed` collapses the table to a single row.
 *   - Switching to `Processing` renders the two Processing rows and the
 *     count badge of `2` on the tab.
 *
 * Full a11y axe scan deferred to Story 7.8 per AC 6.
 */

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    ;(globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver
  }
})

afterEach(async () => {
  await act(async () => {
    await i18next.changeLanguage('en')
    useLocaleStore.setState({ locale: 'en' })
  })
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dashboard/payouts']}>
      <Routes>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route path="payouts" element={<Payouts />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('Payouts', () => {
  it('renders the Agent Payouts page heading + subhead under DashboardLayout', () => {
    renderPage()
    const heading = screen.getByRole('heading', { level: 1, name: /Agent Payouts/ })
    expect(heading).toBeInTheDocument()
    expect(screen.getByText(/Manage and automate commission distributions via SyncPay/)).toBeInTheDocument()
  })

  it('renders all seven payout rows on the default All Payouts tab', () => {
    renderPage()
    const tbody = screen.getByTestId('dashboard-payouts-tbody')
    const rows = within(tbody).getAllByTestId('dashboard-payouts-row')
    expect(rows).toHaveLength(7)
  })

  it('switching to Failed collapses the table to a single row', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByTestId('dashboard-payouts-tab-failed'))
    const tbody = screen.getByTestId('dashboard-payouts-tbody')
    const rows = within(tbody).getAllByTestId('dashboard-payouts-row')
    expect(rows).toHaveLength(1)
    // James Wilson is the single Failed row in the mock data.
    expect(within(tbody).getByText('James Wilson')).toBeInTheDocument()
  })

  it('switching to Processing renders the two Processing rows', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByTestId('dashboard-payouts-tab-processing'))
    const tbody = screen.getByTestId('dashboard-payouts-tbody')
    const rows = within(tbody).getAllByTestId('dashboard-payouts-row')
    expect(rows).toHaveLength(2)
  })

  it('renders the "Processing" tab with a count badge of 2', () => {
    renderPage()
    const tab = screen.getByTestId('dashboard-payouts-tab-processing')
    expect(within(tab).getByText('2')).toBeInTheDocument()
  })

  it('renders the empty-state row when search filtering has zero matches', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText(/Search agents/), 'NO_MATCH_AGENT')
    await user.click(screen.getByRole('button', { name: /Filter results/ }))
    expect(screen.getByText('No payouts found matching your criteria.')).toBeInTheDocument()
    expect(screen.getByText(/Showing 0 of 7 results/)).toBeInTheDocument()
  })

  it('matches translated status labels in search filtering', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await i18next.changeLanguage('es')
      useLocaleStore.setState({ locale: 'es' })
    })
    renderPage()

    await user.type(screen.getByLabelText(/Buscar agentes/), 'Procesando')
    await user.click(screen.getByRole('button', { name: /Filtrar resultados/ }))

    const tbody = screen.getByTestId('dashboard-payouts-tbody')
    expect(within(tbody).getAllByTestId('dashboard-payouts-row')).toHaveLength(2)
  })

  it('keeps pagination boundary buttons disabled while all filtered rows are shown', () => {
    renderPage()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })
})
