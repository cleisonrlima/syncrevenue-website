import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, act } from '@testing-library/react'
import i18next from '@/i18n'
import EncryptedTransitNote from './EncryptedTransitNote'

describe('EncryptedTransitNote', () => {
  afterEach(async () => {
    cleanup()
    await i18next.changeLanguage('en')
  })

  it('renders shield SVG with aria-hidden', () => {
    const { container } = render(<EncryptedTransitNote />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('focusable', 'false')
  })

  it('resolves copy from forms.encryptedNote (en)', async () => {
    await act(async () => {
      await i18next.changeLanguage('en')
    })
    render(<EncryptedTransitNote />)
    expect(screen.getByText(/Encrypted/i)).toBeInTheDocument()
  })

  it('resolves copy from forms.encryptedNote (pt-BR)', async () => {
    await act(async () => {
      await i18next.changeLanguage('pt-BR')
    })
    render(<EncryptedTransitNote />)
    expect(screen.getByText(/criptografad/i)).toBeInTheDocument()
  })

  it('accepts a custom className', () => {
    const { container } = render(<EncryptedTransitNote className="extra-class" />)
    expect(container.querySelector('.extra-class')).not.toBeNull()
  })
})
