import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from './use-mobile'

/**
 * Story 7.1 (AC 4) — useIsMobile hook.
 *
 * Asserts the 1:1 port preserves three guarantees:
 *   1. Returns true when the (max-width: 767px) media query matches.
 *   2. Returns false when the query does not match.
 *   3. Responds to media-query change events (resize across the
 *      breakpoint) without re-renders being dropped.
 *
 * jsdom does NOT provide matchMedia by default — the test stubs it before
 * each case and restores it after.
 */
describe('useIsMobile', () => {
  type MQLChangeHandler = (event: MediaQueryListEvent) => void

  let mediaQueryListeners: MQLChangeHandler[]
  let currentMatches: boolean

  beforeEach(() => {
    mediaQueryListeners = []
    currentMatches = false

    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => {
        return {
          matches: currentMatches,
          media: query,
          onchange: null,
          addEventListener: (_type: string, listener: MQLChangeHandler) => {
            mediaQueryListeners.push(listener)
          },
          removeEventListener: (_type: string, listener: MQLChangeHandler) => {
            mediaQueryListeners = mediaQueryListeners.filter(h => h !== listener)
          },
          // Legacy fallback — present so the legacy path can be exercised in a
          // separate test if needed; not invoked when addEventListener exists.
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        } as unknown as MediaQueryList
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns false on desktop viewports (query does not match)', () => {
    currentMatches = false
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('returns true when the (max-width: 767px) query matches at mount', () => {
    currentMatches = true
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('updates when the media query fires a change event (resize across breakpoint)', () => {
    currentMatches = false
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    act(() => {
      mediaQueryListeners.forEach(listener =>
        listener({ matches: true } as MediaQueryListEvent),
      )
    })

    expect(result.current).toBe(true)
  })

  it('removes its listener on unmount (no leaked handlers)', () => {
    const { unmount } = renderHook(() => useIsMobile())
    expect(mediaQueryListeners.length).toBe(1)
    unmount()
    expect(mediaQueryListeners.length).toBe(0)
  })

  it('does not throw when matchMedia exposes no listener API', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => {
        return {
          matches: false,
          media: query,
          onchange: null,
          dispatchEvent: () => false,
        } as unknown as MediaQueryList
      }),
    )

    expect(() => renderHook(() => useIsMobile())).not.toThrow()
  })
})
