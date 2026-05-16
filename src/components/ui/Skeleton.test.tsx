import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('renders with role="status" and aria-busy="true" by default', () => {
    render(<Skeleton data-testid="sk" />)
    const el = screen.getByTestId('sk')
    expect(el.getAttribute('role')).toBe('status')
    expect(el.getAttribute('aria-busy')).toBe('true')
  })

  it('merges custom className with base classes', () => {
    render(<Skeleton data-testid="sk" className="h-4 w-32" />)
    const el = screen.getByTestId('sk')
    expect(el.className).toContain('h-4')
    expect(el.className).toContain('w-32')
    expect(el.className).toContain('rounded-md')
  })

  it('accepts aria-label override for accessible name', () => {
    render(<Skeleton aria-label="Loading leads" data-testid="sk" />)
    expect(screen.getByTestId('sk').getAttribute('aria-label')).toBe('Loading leads')
  })

  it('allows role override', () => {
    render(<Skeleton role="presentation" data-testid="sk" />)
    expect(screen.getByTestId('sk').getAttribute('role')).toBe('presentation')
  })
})
