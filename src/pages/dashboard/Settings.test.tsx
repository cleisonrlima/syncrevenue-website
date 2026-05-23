import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Settings from './Settings'
import '@/i18n'

/**
 * Story 7.3 (AC 5 + AC 6): Coverage for the Platform Settings page.
 *
 * Asserts the structural contract of the Figma port:
 *   - The page mounts under `<DashboardLayout>` without crashing.
 *   - The "Platform Settings" page heading renders.
 *   - The default `general` tab renders the GeneralSettings sub-component
 *     (Organization Profile heading + Danger Zone block).
 *   - Switching to `team` swaps the content area to TeamSettings (table
 *     with the three mock members).
 *   - Switching to `security` reveals SecuritySettings (Authentication +
 *     API Keys headings).
 *   - The Save Changes button toggles to "Saved Successfully" on click.
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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dashboard/settings']}>
      <Routes>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('Settings', () => {
  it('renders the Platform Settings page heading + subhead under DashboardLayout', () => {
    renderPage()
    const heading = screen.getByRole('heading', { level: 1, name: /Platform Settings/ })
    expect(heading).toBeInTheDocument()
    expect(
      screen.getByText(/Manage your organization's preferences, billing, and team access/),
    ).toBeInTheDocument()
  })

  it('defaults to the General Profile tab and renders the Organization Profile + Danger Zone blocks', () => {
    renderPage()
    expect(
      screen.getByRole('heading', { level: 2, name: /Organization Profile/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /Danger Zone/ })).toBeInTheDocument()
  })

  it('defaults currency and timezone to travel-agency market options', () => {
    renderPage()
    const currency = screen.getByLabelText(/Base Currency/) as HTMLSelectElement
    const timezone = screen.getByLabelText(/Timezone/) as HTMLSelectElement

    expect(currency.value).toBe('brl')
    expect(Array.from(currency.options).map((option) => option.value)).toEqual([
      'brl',
      'eur',
      'usd',
      'gbp',
    ])

    expect(timezone.value).toBe('America/Sao_Paulo')
    expect(Array.from(timezone.options).map((option) => option.value)).toEqual([
      'America/Sao_Paulo',
      'America/New_York',
      'Europe/London',
      'America/Detroit',
      'America/Los_Angeles',
      'Etc/GMT',
    ])
  })

  it('switching to Team Members swaps to the TeamSettings table with the three mock members', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByTestId('dashboard-settings-tab-team'))
    const content = screen.getByTestId('dashboard-settings-content')
    expect(within(content).getByRole('heading', { level: 2, name: /Team Members/ })).toBeInTheDocument()
    expect(within(content).getByText('Alex Rivera')).toBeInTheDocument()
    expect(within(content).getByText('Morgan Smith')).toBeInTheDocument()
    expect(within(content).getByText('Taylor Doe')).toBeInTheDocument()
  })

  it('switching to Security & API reveals the Authentication + API Keys blocks', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByTestId('dashboard-settings-tab-security'))
    const content = screen.getByTestId('dashboard-settings-content')
    expect(within(content).getByRole('heading', { level: 2, name: /Authentication/ })).toBeInTheDocument()
    expect(within(content).getByRole('heading', { level: 2, name: /API Keys/ })).toBeInTheDocument()
  })

  it('reveals the API key placeholder through an explicit keyboard-accessible button', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByTestId('dashboard-settings-tab-security'))
    expect(screen.getByText('sk_live_••••••••••••••••')).toBeInTheDocument()
    const reveal = screen.getByRole('button', { name: /Reveal API key placeholder/ })
    await user.click(reveal)
    expect(screen.getByText('sk_live_[demo-key-hidden]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Hide API key placeholder/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('integration connect/disconnect buttons toggle local connected state', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByTestId('dashboard-settings-tab-integrations'))
    const hubSpotCard = screen.getByTestId('dashboard-settings-integration-hubspot')
    const button = within(hubSpotCard).getByRole('button', { name: 'Connect' })
    await user.click(button)
    expect(within(hubSpotCard).getByText('Connected')).toBeInTheDocument()
    expect(within(hubSpotCard).getByRole('button', { name: 'Disconnect' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('Save button flips to "Saved Successfully" on click and reverts after the 2s timeout', async () => {
    const user = userEvent.setup()
    renderPage()
    const button = screen.getByTestId('dashboard-settings-save')
    expect(button).toHaveTextContent('Save Changes')
    await user.click(button)
    expect(button).toHaveTextContent('Saved Successfully')
    // The 2s revert is fired via setTimeout; flushing it inside React's act
    // boundary keeps state updates batched and silences test warnings.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2100))
    })
    expect(button).toHaveTextContent('Save Changes')
  }, 10000)
})
