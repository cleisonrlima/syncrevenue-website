import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18next from 'i18next'
import '@/i18n'
import { useLocaleStore } from '@/store/useLocaleStore'
import Contact from './Contact'

vi.mock('@/lib/api', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    postContact: vi.fn(),
  }
})

async function setLocale(locale: 'en' | 'pt-BR' | 'es') {
  useLocaleStore.setState({ locale })
  await i18next.changeLanguage(locale)
}

beforeEach(async () => {
  await setLocale('en')
})

describe('Contact section', () => {
  it('renders the section shell with id="contato", .sec class (not sec-deep), eyebrow, accent heading, subhead', () => {
    const { container } = render(<Contact />)

    const section = container.querySelector('section#contato')
    expect(section).not.toBeNull()
    expect(section?.classList.contains('sec')).toBe(true)
    expect(section?.classList.contains('sec-deep')).toBe(false)

    expect(screen.getByText('Contact')).toBeInTheDocument()

    const heading = screen.getByRole('heading', { level: 2, name: /Talk to .*Sync Sirius/ })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveAttribute('id', 'contact-heading')
    const accent = within(heading).getByText('Sync Sirius')
    expect(accent.classList.contains('accent')).toBe(true)

    expect(
      screen.getByText(/For commercial questions, support, partnerships, or press/i)
    ).toBeInTheDocument()
  })

  it('renders the 40/60 form-grid layout container', () => {
    const { container } = render(<Contact />)
    const grid = container.querySelector('.form-grid')
    expect(grid).not.toBeNull()
    expect(grid?.classList.contains('grid')).toBe(true)
  })

  it('renders three channel rows in order with kind-aware wrapping (mailto / tel / static)', () => {
    const { container } = render(<Contact />)
    const channels = container.querySelectorAll('.channel')
    expect(channels.length).toBe(3)

    // 0 = email → <a href="mailto:...">
    const emailEl = channels[0] as HTMLElement
    expect(emailEl.tagName).toBe('A')
    expect(emailEl.getAttribute('href')).toMatch(/^mailto:contato@syncsirius\.com$/)
    expect(emailEl.textContent).toMatch(/Email/)
    expect(emailEl.textContent).toMatch(/contato@syncsirius\.com/)

    // 1 = phone → <a href="tel:...">
    const phoneEl = channels[1] as HTMLElement
    expect(phoneEl.tagName).toBe('A')
    expect(phoneEl.getAttribute('href')).toMatch(/^tel:\+13055550100$/)
    expect(phoneEl.textContent).toMatch(/Phone/)

    // 2 = address → static, not an anchor
    const addrEl = channels[2] as HTMLElement
    expect(addrEl.tagName).not.toBe('A')
    expect(addrEl.textContent).toMatch(/Headquarters/)
    expect(addrEl.textContent).toMatch(/Miami/)
  })

  it('renders the info-card with title + subtitle from contact.infoCard.*', () => {
    const { container } = render(<Contact />)
    const infoCard = container.querySelector('.info-card')
    expect(infoCard).not.toBeNull()
    expect(infoCard?.textContent).toMatch(/Average response time/)
    expect(infoCard?.textContent).toMatch(/Under 4 hours/)
  })

  it('renders localized channels + heading in pt-BR', async () => {
    await setLocale('pt-BR')
    const { container } = render(<Contact />)

    expect(screen.getByText('Contato')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: /Fale com a .*Sync Sirius/ })
    ).toBeInTheDocument()

    const channels = container.querySelectorAll('.channel')
    expect(channels[0].textContent).toMatch(/E-mail/)
    expect(channels[1].textContent).toMatch(/Telefone/)
    expect(channels[2].textContent).toMatch(/Sede/)
  })
})
