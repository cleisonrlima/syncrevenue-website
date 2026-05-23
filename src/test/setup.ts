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

// Story 7.4 follow-up plumbing (originally a Story 7.1 oversight): the
// react-slick dependency added in Story 7.1 transitively imports `enquire.js`,
// which requires `window.matchMedia` at module load. jsdom does not provide
// `matchMedia` by default, so any test that imports `App.tsx` (which imports
// `Landing.tsx` which imports `react-slick`) would otherwise fail to load.
// This polyfill is a minimal jsdom-completeness shim — it does not influence
// any production behaviour because Vitest only loads this setup file under
// the test environment.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  ;(window as unknown as { matchMedia: Window['matchMedia'] }).matchMedia = (
    query: string,
  ) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // legacy MediaQueryList API used by enquire.js
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}


vi.mock('motion/react', async () => {
  const { createElement, forwardRef, Fragment } = await import('react')
  return {
    LazyMotion: ({ children }: { children: unknown }) => children as never,
    useInView: () => true,
    useReducedMotion: () => false,
    domAnimation: {},
    // Story 7.4 additions (originally a Story 7.1 oversight surfaced when
    // Landing.tsx was ported): the Figma 'teste' Landing uses these motion
    // hooks/components; tests that render Landing transitively (e.g.,
    // App.routes.test.tsx) need them stubbed so React does not throw when
    // the component evaluates. The stubs return inert values — jsdom does
    // not animate anyway, so production behaviour is unaffected.
    AnimatePresence: ({ children }: { children: unknown }) =>
      createElement(Fragment, null, children as never),
    useScroll: () => ({
      // Provide a MotionValue-shaped object so callers that destructure or
      // pass `scrollYProgress` into `useTransform` do not blow up. The
      // accessor methods are inert (no listeners ever fire in jsdom).
      scrollYProgress: {
        get: () => 0,
        set: () => {},
        on: () => () => {},
        current: 0,
      },
    }),
    // Real `useTransform` maps an input MotionValue through (input range,
    // output range). The stub returns the first output value verbatim so
    // callers that pass it into `style={{ y }}` see a stable string and do
    // not throw at render time.
    useTransform: (_input: unknown, _from: unknown, to: unknown) =>
      Array.isArray(to) && to.length > 0 ? to[0] : '',
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
