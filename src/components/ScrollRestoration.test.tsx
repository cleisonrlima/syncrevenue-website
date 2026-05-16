import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import ScrollRestoration from './ScrollRestoration'

function Nav({ to }: { to: string }) {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => navigate(to)}>
      go
    </button>
  )
}

describe('ScrollRestoration', () => {
  let scrollToSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  })

  afterEach(() => {
    scrollToSpy.mockRestore()
  })

  it('renders null (no DOM)', () => {
    const { container } = render(
      <MemoryRouter>
        <ScrollRestoration />
      </MemoryRouter>,
    )
    expect(container.firstChild).toBeNull()
  })

  it('scrolls to top on pathname change without hash', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <ScrollRestoration />
        <Routes>
          <Route path="/" element={<Nav to="/privacy" />} />
          <Route path="/privacy" element={<div>privacy</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(scrollToSpy).not.toHaveBeenCalled()
    await user.click(document.querySelector('button')!)

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' })
  })

  it('does not scroll on initial mount', () => {
    render(
      <MemoryRouter initialEntries={['/privacy']}>
        <ScrollRestoration />
      </MemoryRouter>,
    )
    expect(scrollToSpy).not.toHaveBeenCalled()
  })

  it('does not scroll when target location has a hash', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <ScrollRestoration />
        <Routes>
          <Route path="/" element={<Nav to="/#hero" />} />
        </Routes>
      </MemoryRouter>,
    )

    scrollToSpy.mockClear()
    await user.click(document.querySelector('button')!)

    expect(scrollToSpy).not.toHaveBeenCalled()
  })
})
