import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import FormFoot from './FormFoot'

describe('FormFoot', () => {
  it('renders note and submit slots', () => {
    render(<FormFoot note={<span>Encrypted</span>} submit={<button type="submit">Send</button>} />)
    expect(screen.getByText('Encrypted')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
  })

  it('applies stack-then-row classes for < 600px breakpoint', () => {
    const { container } = render(
      <FormFoot note={<span>n</span>} submit={<button type="submit">s</button>} />,
    )
    const foot = container.querySelector('.form-foot') as HTMLElement
    expect(foot).not.toBeNull()
    expect(foot.className).toContain('flex-col')
    expect(foot.className).toContain('min-[600px]:flex-row')
    expect(foot.className).toContain('min-[600px]:justify-between')
  })
})
