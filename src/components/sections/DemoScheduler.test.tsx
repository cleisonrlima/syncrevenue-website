import { render, screen, within } from '@testing-library/react'
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

describe('DemoScheduler (Story 6.10 — 40/60 grid)', () => {
  it('renders the section landmark with id #agendar-demo and localized aria-label', () => {
    render(<DemoScheduler />)
    const section = screen.getByRole('region', { name: 'Schedule a SyncRevenue demo' })
    expect(section).toBeInTheDocument()
    expect(section).toHaveAttribute('id', 'agendar-demo')
  })

  it('uses the sec-deep #0A0B22 background per design (no gradient)', () => {
    // Design source: Hero.html `.sec-deep{background:#0A0B22}` — same token as
    // ClientReferences. The earlier var(--ink) baseline (Story 6.8) is
    // superseded by the design handoff so demo + testimonials share the
    // darker section tone.
    render(<DemoScheduler />)
    const section = screen.getByRole('region', { name: 'Schedule a SyncRevenue demo' })
    expect(section.className).toContain('bg-[#0A0B22]')
    expect(section.className).not.toMatch(/bg-gradient-to-b/)
    expect(section.className).toMatch(/text-white/)
  })

  it('renders eyebrow + accent-split heading + subhead from demo.* keys', () => {
    render(<DemoScheduler />)
    const section = screen.getByRole('region', { name: 'Schedule a SyncRevenue demo' })
    expect(within(section).getByText('Schedule a demo')).toBeInTheDocument()
    const heading = within(section).getByRole('heading', { level: 2 })
    expect(heading.textContent).toContain('See SyncRevenue running')
    expect(heading.textContent).toContain('in your workflow')
    const accent = within(heading).getByText('in your workflow')
    expect(accent.className).toMatch(/text-\[var\(--accent-brand-soft\)\]/)
    expect(
      within(section).getByText(/A short conversation with the team/i),
    ).toBeInTheDocument()
  })

  it('renders a 40/60 form-grid (info-side on left, form-card on right at desktop)', () => {
    const { container } = render(<DemoScheduler />)
    const grid = container.querySelector('.form-grid') as HTMLElement
    expect(grid).not.toBeNull()
    expect(grid.className).toMatch(/min-\[900px\]:grid-cols-\[minmax\(0,1fr\)_minmax\(0,1\.35fr\)\]/)
    expect(grid.className).toMatch(/grid-cols-1/)
  })

  it('renders exactly three .step rows resolved from demo.info.steps.*', () => {
    const { container } = render(<DemoScheduler />)
    const steps = container.querySelectorAll('.steps .step')
    expect(steps).toHaveLength(3)
    const titles = Array.from(steps).map(s => s.querySelector('strong')?.textContent ?? '')
    expect(titles[0]).toMatch(/Discovery call/i)
    expect(titles[1]).toMatch(/Personalized demo/i)
    expect(titles[2]).toMatch(/Proposal/i)
  })

  it('renders the info-card with title + subtitle from demo.info.infoCard.*', () => {
    const { container } = render(<DemoScheduler />)
    const infoCard = container.querySelector('.info-card') as HTMLElement
    expect(infoCard).not.toBeNull()
    expect(within(infoCard).getByText('Reply within 1 business day')).toBeInTheDocument()
    expect(within(infoCard).getByText('Maria or Lucas reaches out personally.')).toBeInTheDocument()
    const iconBox = infoCard.querySelector('.info-card-ico') as HTMLElement
    expect(iconBox).not.toBeNull()
    expect(iconBox.className).toMatch(/bg-\[var\(--accent-brand-dim\)\]/)
  })

  it('embeds the DemoForm inside the same section (no modal)', () => {
    render(<DemoScheduler />)
    const section = screen.getByRole('region', { name: 'Schedule a SyncRevenue demo' })
    const form = within(section).getByRole('form', { name: 'Request a demonstration' })
    expect(form).toBeInTheDocument()
    expect(within(section).getByLabelText(/Full name/i)).toBeInTheDocument()
  })

  it('avoids horizontal overflow on mobile', () => {
    render(<DemoScheduler />)
    const section = screen.getByRole('region', { name: 'Schedule a SyncRevenue demo' })
    expect(section.className).toMatch(/overflow-hidden/)
  })

  it('renders pt-BR aria-label + heading', async () => {
    await setLocale('pt-BR')
    render(<DemoScheduler />)
    const section = screen.getByRole('region', { name: 'Agendar uma demonstração SyncRevenue' })
    expect(section).toBeInTheDocument()
    const heading = within(section).getByRole('heading', { level: 2 })
    expect(heading.textContent).toContain('Veja o SyncRevenue rodando')
    expect(heading.textContent).toContain('no seu fluxo')
  })

  it('renders es aria-label + heading', async () => {
    await setLocale('es')
    render(<DemoScheduler />)
    const section = screen.getByRole('region', { name: 'Agendar una demostración SyncRevenue' })
    expect(section).toBeInTheDocument()
    const heading = within(section).getByRole('heading', { level: 2 })
    expect(heading.textContent).toContain('Vea SyncRevenue funcionando')
    expect(heading.textContent).toContain('en su flujo')
  })
})
