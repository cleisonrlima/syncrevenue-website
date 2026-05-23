import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import '@/i18n'
import Demo from './Demo'

/**
 * Story 7.4 (AC 7): smoke tests for the verbatim Figma DemoForm port mounted
 * at `/demo` (`src/pages/Demo.tsx`).
 *
 * No local mocks beyond the global ones in `src/test/setup.ts` — `motion.div`
 * is already covered by the global Proxy mock (the success panel uses
 * `<motion.div initial={...} animate={...}>` which the Proxy strips and
 * renders as a plain `<div>`). There is no slick / useScroll involvement.
 */

const renderDemo = () =>
  render(
    <MemoryRouter initialEntries={['/demo']}>
      <Demo />
    </MemoryRouter>,
  )

describe('Demo (Story 7.4 — /demo)', () => {
  it('renders without crashing under MemoryRouter', () => {
    expect(() => renderDemo()).not.toThrow()
  })

  it('renders all five form fields with the verbatim Figma labels', () => {
    renderDemo()

    // Programmatic label associations were added during port (see Demo.tsx
    // JSDoc) — getByLabelText is the canonical query and validates the
    // accessibility-tightening that the port adds beyond the Figma source.
    expect(screen.getByLabelText(/First Name/i)).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText(/Last Name/i)).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText(/Work Email/i)).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText(/Company Name/i)).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText(/Phone Number \(Optional\)/i)).toHaveAttribute('type', 'tel')
  })

  it('renders the gradient submit button with verbatim Figma copy', () => {
    renderDemo()
    expect(screen.getByRole('button', { name: /Request Demo/i })).toHaveAttribute('type', 'submit')
  })

  it('flips to the post-submit motion success panel when the form is submitted', async () => {
    const user = userEvent.setup()
    renderDemo()

    await user.type(screen.getByLabelText(/First Name/i), 'Jane')
    await user.type(screen.getByLabelText(/Last Name/i), 'Doe')
    await user.type(screen.getByLabelText(/Work Email/i), 'jane@agency.com')
    await user.type(screen.getByLabelText(/Company Name/i), 'Acme Agency')

    const form = screen.getByRole('button', { name: /Request Demo/i }).closest('form')
    expect(form).not.toBeNull()
    // Use fireEvent.submit so the `required` validation runs against the
    // values we typed above. userEvent.click on submit also works but
    // fireEvent.submit is the canonical "no native validation noise" path.
    fireEvent.submit(form as HTMLFormElement)

    expect(
      screen.getByRole('heading', { level: 3, name: /Request Received/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Thanks for your interest! One of our product specialists/i),
    ).toBeInTheDocument()
    // The form is removed once submitted — assert mutual exclusion to catch
    // a regression where both panels render simultaneously.
    expect(screen.queryByLabelText(/Work Email/i)).not.toBeInTheDocument()
  })

  it('returns to the form when the "Submit another request" reset link is clicked', async () => {
    const user = userEvent.setup()
    renderDemo()

    await user.type(screen.getByLabelText(/First Name/i), 'Jane')
    await user.type(screen.getByLabelText(/Last Name/i), 'Doe')
    await user.type(screen.getByLabelText(/Work Email/i), 'jane@agency.com')
    await user.type(screen.getByLabelText(/Company Name/i), 'Acme Agency')

    const form = screen.getByRole('button', { name: /Request Demo/i }).closest('form')
    fireEvent.submit(form as HTMLFormElement)

    const successPanel = screen
      .getByRole('heading', { level: 3, name: /Request Received/i })
      .closest('div')
    expect(successPanel).not.toBeNull()
    const resetButton = within(successPanel as HTMLElement).getByRole('button', {
      name: /Submit another request/i,
    })
    await user.click(resetButton)

    expect(screen.getByLabelText(/Work Email/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Request Received/i })).not.toBeInTheDocument()
  })

  it('renders the "Back to Home" nav link pointing at /', () => {
    renderDemo()
    const backLinks = screen
      .getAllByRole('link', { name: /Back to Home/i })
      .filter((el) => el.getAttribute('href') === '/')
    expect(backLinks.length).toBeGreaterThanOrEqual(1)
  })
})
