import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18next from 'i18next'
import '@/i18n'
import { useLocaleStore } from '@/store/useLocaleStore'
import DemoScheduler from './DemoScheduler'

async function setLocale(locale: 'en' | 'pt-BR' | 'es') {
  useLocaleStore.setState({ locale })
  await i18next.changeLanguage(locale)
}

beforeEach(async () => {
  await setLocale('en')
})

afterEach(async () => {
  vi.restoreAllMocks()
  await setLocale('en')
})

describe('DemoScheduler', () => {
  it('renders the section as a landmark with the localized aria-label', () => {
    render(<DemoScheduler />)

    const section = screen.getByRole('region', { name: 'Schedule a SyncRevenue demo' })
    expect(section).toBeInTheDocument()
    expect(section).toHaveAttribute('id', 'demo-scheduler')
  })

  it('applies the sober dark bookend background (Story 6.8 — Epic 6 sober palette)', () => {
    render(<DemoScheduler />)

    const section = screen.getByRole('region', { name: 'Schedule a SyncRevenue demo' })
    // Story 6.8 replaced the brand gradient (`bg-gradient-to-b from-[#0D0D3A] to-[#080820]`)
    // with the flat `--ink` token from the Epic 6 sober palette.
    expect(section.className).toContain('bg-[var(--ink)]')
    expect(section.className).not.toMatch(/bg-gradient-to-b/)
    expect(section.className).toMatch(/text-white/)
  })

  it('renders the eyebrow, heading, and supporting copy from sections.demoScheduler.*', () => {
    render(<DemoScheduler />)

    const section = screen.getByRole('region', { name: 'Schedule a SyncRevenue demo' })
    expect(within(section).getByText('Ready When You Are')).toBeInTheDocument()
    expect(
      within(section).getByRole('heading', { name: 'Schedule Your SyncRevenue Demo' }),
    ).toBeInTheDocument()
    expect(
      within(section).getByText(
        "See multi-GDS commission recovery applied to your agency's reconciliation workflow.",
      ),
    ).toBeInTheDocument()
  })

  it('renders exactly one in-section CTA with the lg GradientButton size', () => {
    render(<DemoScheduler />)

    const section = screen.getByRole('region', { name: 'Schedule a SyncRevenue demo' })
    const ctaButtons = within(section).getAllByRole('button', { name: 'Schedule a Demo' })
    expect(ctaButtons).toHaveLength(1)

    const cta = ctaButtons[0]
    expect(cta).toHaveClass('bg-gradient-brand')
    expect(cta).toHaveClass('px-8')
    expect(cta).toHaveClass('py-4')
    expect(cta).toHaveClass('min-h-[44px]')
  })

  it('embeds the DemoForm inside the same section (no modal)', () => {
    render(<DemoScheduler />)

    const section = screen.getByRole('region', { name: 'Schedule a SyncRevenue demo' })
    const form = within(section).getByRole('form', { name: 'Request a Demo' })
    expect(form).toBeInTheDocument()
    expect(within(section).getByLabelText(/Full Name/i)).toBeInTheDocument()
  })

  it('moves focus to the Full Name input and scrolls the form into view when CTA is clicked', async () => {
    const user = userEvent.setup()
    const scrollSpy = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollSpy,
    })
    const originalHash = window.location.hash

    render(<DemoScheduler />)

    const cta = screen.getByRole('button', { name: 'Schedule a Demo' })
    await user.click(cta)

    expect(document.activeElement).toBe(screen.getByLabelText(/Full Name/i))
    expect(scrollSpy).toHaveBeenCalled()
    expect(window.location.hash).toBe(originalHash)
  })

  it('avoids horizontal overflow at mobile widths', () => {
    render(<DemoScheduler />)

    const section = screen.getByRole('region', { name: 'Schedule a SyncRevenue demo' })
    expect(section.className).toMatch(/overflow-hidden/)
    const container = section.querySelector('div')
    expect(container).not.toBeNull()
    expect(container!.className).toMatch(/max-w-\[960px\]/)
  })

  it('renders the CTA in pt-BR when the locale changes', async () => {
    await setLocale('pt-BR')
    render(<DemoScheduler />)

    expect(screen.getByRole('button', { name: 'Agendar uma Demo' })).toBeInTheDocument()
  })

  it('renders the CTA in es when the locale changes', async () => {
    await setLocale('es')
    render(<DemoScheduler />)

    expect(screen.getByRole('button', { name: 'Agendar una Demo' })).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Agendar una demostración SyncRevenue' }),
    ).toBeInTheDocument()
  })
})
