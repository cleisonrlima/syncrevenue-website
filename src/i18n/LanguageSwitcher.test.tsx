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

  it('renders three locale buttons', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'PT-BR' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ES' })).toBeInTheDocument()
  })

  it('active locale button has aria-current="true"', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: 'PT-BR' })).not.toHaveAttribute('aria-current')
  })

  it('clicking PT-BR executes locale flow in order', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)
    await user.click(screen.getByRole('button', { name: 'PT-BR' }))
    expect(i18next.changeLanguage).toHaveBeenCalledWith('pt-BR')
    expect(useLocaleStore.getState().locale).toBe('pt-BR')
    expect(localStorage.getItem('i18nextLng')).toBe('pt-BR')
  })

  it('wrapper has aria-label="Select language"', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByRole('group', { name: 'Select language' })).toBeInTheDocument()
  })
})
