import '@testing-library/jest-dom'
import { vi } from 'vitest'

class IntersectionObserverMock {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  private callback: IntersectionObserverCallback
  constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    this.callback = callback
  }
  observe(target: Element) {
    queueMicrotask(() => {
      const entry = {
        target,
        isIntersecting: true,
        intersectionRatio: 1,
        boundingClientRect: target.getBoundingClientRect(),
        intersectionRect: target.getBoundingClientRect(),
        rootBounds: null,
        time: Date.now(),
      } as IntersectionObserverEntry
      this.callback([entry], this as unknown as IntersectionObserver)
    })
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  ;(globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
    IntersectionObserverMock as unknown as typeof IntersectionObserver
}

vi.mock('motion/react', async () => {
  const { createElement, forwardRef } = await import('react')
  return {
    LazyMotion: ({ children }: { children: unknown }) => children as never,
    useInView: () => true,
    useReducedMotion: () => false,
    domAnimation: {},
    motion: new Proxy(
      {},
      {
        get: (_target, tag: string) =>
          forwardRef((props: Record<string, unknown>, ref) => {
            const {
              initial: _initial,
              animate: _animate,
              transition: _transition,
              exit: _exit,
              variants: _variants,
              whileHover: _wh,
              whileTap: _wt,
              whileInView: _wi,
              ...rest
            } = props
            return createElement(tag, { ref, ...rest })
          }),
      },
    ),
  }
})

vi.mock('motion/react-m', async () => {
  const { createElement, forwardRef } = await import('react')
  const makeTag = (tag: string) =>
    forwardRef((props: Record<string, unknown>, ref) => {
      const {
        initial: _initial,
        animate: _animate,
        transition: _transition,
        exit: _exit,
        variants: _variants,
        whileHover: _wh,
        whileTap: _wt,
        whileInView: _wi,
        ...rest
      } = props
      return createElement(tag, { ref, ...rest, 'data-motion': 'true' })
    })
  const tags = [
    'section',
    'div',
    'span',
    'a',
    'button',
    'ul',
    'li',
    'p',
    'h1',
    'h2',
    'h3',
    'header',
    'footer',
    'nav',
    'article',
    'main',
    'aside',
    'img',
  ] as const
  const exports: Record<string, ReturnType<typeof makeTag>> = {}
  for (const tag of tags) exports[tag] = makeTag(tag)
  return exports
})
