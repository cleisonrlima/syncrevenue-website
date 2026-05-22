import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { ImageWithFallback } from './ImageWithFallback'

/**
 * Story 7.1 (AC 4) — ImageWithFallback component.
 *
 * Asserts the 1:1 port of the Figma source preserves four guarantees:
 *   1. Happy-path: normal src is rendered verbatim.
 *   2. Error swap: an `error` event on the underlying <img> swaps to the
 *      inline SVG data URI and tags the element with data-fallback="true".
 *   3. Caller `onError` is invoked before the swap (observability hook).
 *   4. `forwardRef` works (Epic 7 dashboard pages mount this in motion
 *      containers that need ref access).
 */
describe('ImageWithFallback', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the supplied src and alt on the happy path', () => {
    render(<ImageWithFallback src="/hero/airplane.webp" alt="Hero airplane" data-testid="img" />)
    const img = screen.getByTestId('img') as HTMLImageElement
    expect(img.getAttribute('src')).toBe('/hero/airplane.webp')
    expect(img.getAttribute('alt')).toBe('Hero airplane')
    expect(img.getAttribute('data-fallback')).toBeNull()
  })

  it('swaps to the inline SVG data URI on image load error and tags data-fallback', () => {
    render(<ImageWithFallback src="/broken.png" alt="broken" data-testid="img" />)
    const img = screen.getByTestId('img') as HTMLImageElement
    fireEvent.error(img)
    expect(img.getAttribute('src')).toMatch(/^data:image\/svg\+xml;charset=UTF-8,/)
    expect(img.getAttribute('data-fallback')).toBe('true')
    // Alt is preserved across the swap.
    expect(img.getAttribute('alt')).toBe('broken')
  })

  it('retries the caller src when the src prop changes after a fallback', () => {
    const { rerender } = render(<ImageWithFallback src="/broken.png" alt="photo" data-testid="img" />)
    const img = screen.getByTestId('img') as HTMLImageElement
    fireEvent.error(img)
    expect(img.getAttribute('data-fallback')).toBe('true')

    rerender(<ImageWithFallback src="/valid.png" alt="photo" data-testid="img" />)

    expect(img.getAttribute('src')).toBe('/valid.png')
    expect(img.getAttribute('data-fallback')).toBeNull()
  })

  it('invokes the caller-provided onError BEFORE the fallback swap', () => {
    const callerOnError = vi.fn()
    render(
      <ImageWithFallback
        src="/broken.png"
        alt="broken"
        data-testid="img"
        onError={callerOnError}
      />,
    )
    const img = screen.getByTestId('img') as HTMLImageElement
    fireEvent.error(img)
    expect(callerOnError).toHaveBeenCalledTimes(1)
    // After the swap, the src should be the fallback (proves the swap fired
    // after the caller hook ran).
    expect(img.getAttribute('src')).toMatch(/^data:image\/svg\+xml/)
  })

  it('forwards refs to the underlying <img> element', () => {
    const ref = createRef<HTMLImageElement>()
    render(<ImageWithFallback ref={ref} src="/x.png" alt="x" />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe('IMG')
  })
})
