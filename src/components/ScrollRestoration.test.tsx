import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ScrollRestoration from './ScrollRestoration'

function Nav({ to }: { to: string }) {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => navigate(to)}>
      go
    </button>
  )
}

function DelayedHashTarget() {
  const [showTarget, setShowTarget] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setShowTarget(true), 250)
    return () => window.clearTimeout(timeoutId)
  }, [])

  return showTarget ? <div id="agendar-demo">demo</div> : null
}

describe('ScrollRestoration', () => {
  let scrollToSpy: ReturnType<typeof vi.spyOn>
  let scrollIntoViewMock: ReturnType<typeof vi.fn>
  let originalScrollIntoView: typeof Element.prototype.scrollIntoView | undefined

  beforeEach(() => {
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    originalScrollIntoView = Element.prototype.scrollIntoView
    scrollIntoViewMock = vi.fn()
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoViewMock,
    })
  })

  afterEach(() => {
    scrollToSpy.mockRestore()
    if (originalScrollIntoView) {
      Object.defineProperty(Element.prototype, 'scrollIntoView', {
        configurable: true,
        value: originalScrollIntoView,
      })
    } else {
      delete (Element.prototype as Partial<Element>).scrollIntoView
    }
    vi.useRealTimers()
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

  it('scrolls to an existing target when the target location has a hash', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <ScrollRestoration />
        <Routes>
          <Route path="/" element={<><Nav to="/#hero" /><div id="hero">hero</div></>} />
        </Routes>
      </MemoryRouter>,
    )

    scrollToSpy.mockClear()
    await user.click(document.querySelector('button')!)

    expect(scrollToSpy).not.toHaveBeenCalled()
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('retries hash scrolling until a lazy-mounted target exists', async () => {
    vi.useFakeTimers()

    render(
      <MemoryRouter initialEntries={[{ pathname: '/', hash: '#agendar-demo' }]}>
        <ScrollRestoration />
        <DelayedHashTarget />
      </MemoryRouter>,
    )

    expect(scrollIntoViewMock).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(250)
    })
    await act(async () => {
      vi.advanceTimersByTime(100)
    })

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' })
  })
})
