import { describe, it, expect, beforeEach } from 'vitest'
import { useLocaleStore } from './useLocaleStore'

describe('useLocaleStore', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'en' })
  })

  it('initializes with en locale', () => {
    expect(useLocaleStore.getState().locale).toBe('en')
  })

  it('changeLocale updates locale', () => {
    useLocaleStore.getState().changeLocale('pt-BR')
    expect(useLocaleStore.getState().locale).toBe('pt-BR')
  })

  it('setState direct update works', () => {
    useLocaleStore.setState({ locale: 'es' })
    expect(useLocaleStore.getState().locale).toBe('es')
  })
})
