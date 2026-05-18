import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import FormTextarea from './FormTextarea'

describe('FormTextarea', () => {
  it('renders textarea with vertical resize + min-height', () => {
    render(<FormTextarea id="msg" aria-label="Message" />)
    const ta = screen.getByRole('textbox', { name: 'Message' })
    expect(ta.tagName).toBe('TEXTAREA')
    expect(ta).toHaveClass('resize-y')
    expect(ta).toHaveClass('min-h-[96px]')
  })

  it('forwards placeholder', () => {
    render(<FormTextarea id="msg" aria-label="Message" placeholder="Type here" />)
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument()
  })

  it('sets aria-invalid when invalid prop is true', () => {
    render(<FormTextarea id="msg" aria-label="Message" invalid />)
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveAttribute('aria-invalid', 'true')
  })
})
