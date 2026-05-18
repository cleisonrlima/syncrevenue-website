import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import FormField from './FormField'

describe('FormField', () => {
  it('renders label associated to children via htmlFor', () => {
    render(
      <FormField label="Full Name" htmlFor="demo-name">
        <input id="demo-name" />
      </FormField>,
    )
    const input = screen.getByLabelText('Full Name')
    expect(input).toBeInTheDocument()
    expect(input.id).toBe('demo-name')
  })

  it('renders required asterisk with aria-hidden', () => {
    render(
      <FormField label="Email" htmlFor="demo-email" required>
        <input id="demo-email" />
      </FormField>,
    )
    const star = screen.getByText('*')
    expect(star).toHaveAttribute('aria-hidden', 'true')
    expect(star).toHaveClass('req')
  })

  it('renders optional marker with default label', () => {
    render(
      <FormField label="Phone" htmlFor="demo-phone" optional>
        <input id="demo-phone" />
      </FormField>,
    )
    expect(screen.getByText('(opcional)')).toHaveClass('opt')
  })

  it('renders error with id matching {htmlFor}-error', () => {
    render(
      <FormField label="Email" htmlFor="demo-email" error="Bad email">
        <input id="demo-email" />
      </FormField>,
    )
    const err = screen.getByText('Bad email')
    expect(err.id).toBe('demo-email-error')
    expect(err).toHaveAttribute('role', 'alert')
  })

  it('omits error node when no error', () => {
    render(
      <FormField label="Company" htmlFor="demo-company">
        <input id="demo-company" />
      </FormField>,
    )
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('does not render required + optional simultaneously without explicit override', () => {
    render(
      <FormField label="Mixed" htmlFor="mixed">
        <input id="mixed" />
      </FormField>,
    )
    expect(screen.queryByText('*')).toBeNull()
    expect(screen.queryByText(/opcional/)).toBeNull()
  })
})
