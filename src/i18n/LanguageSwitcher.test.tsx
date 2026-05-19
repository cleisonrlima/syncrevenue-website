import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LanguageSwitcher from './LanguageSwitcher'
import { useLocaleStore } from '@/store/useLocaleStore'
import i18next from 'i18next'
import '@/i18n'

vi.mock('i18next', async () => {
  const actual = await vi.importActual<typeof import('i18next')>('i18next')
  return { ...actual, default: { ...actual.default, changeLanguage: vi.fn() } }
})

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'en' })
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders the active locale trigger and opens locale options', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)
    const trigger = screen.getByRole('button', { name: 'EN' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menuitemradio', { name: 'EN' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: 'PT-BR' })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: 'ES' })).toBeInTheDocument()
  })

  it('active locale option has aria-checked="true"', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)
    await user.click(screen.getByRole('button', { name: 'EN' }))
    expect(screen.getByRole('menuitemradio', { name: 'EN' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: 'PT-BR' })).toHaveAttribute('aria-checked', 'false')
  })

  it('clicking PT-BR executes locale flow in order', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)
    await user.click(screen.getByRole('button', { name: 'EN' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'PT-BR' }))
    expect(i18next.changeLanguage).toHaveBeenCalledWith('pt-BR')
    expect(useLocaleStore.getState().locale).toBe('pt-BR')
    expect(localStorage.getItem('i18nextLng')).toBe('pt-BR')
  })

  it('wrapper has aria-label="Select language"', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByRole('group', { name: 'Select language' })).toBeInTheDocument()
  })
})
