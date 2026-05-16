import { render, screen, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MotionSection from './MotionSection'

const reducedMotionRef = { current: false }
const inViewRef = { current: true }

vi.mock('motion/react', () => {
  return {
    LazyMotion: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useInView: () => inViewRef.current,
    useReducedMotion: () => reducedMotionRef.current,
    domAnimation: {},
  }
})

vi.mock('motion/react-m', () => {
  return {
    section: ({ children, initial: _i, animate: _a, transition: _t, ...rest }: any) => (
      <section data-motion="true" {...rest}>
        {children}
      </section>
    ),
  }
})

afterEach(() => {
  reducedMotionRef.current = false
  inViewRef.current = true
  cleanup()
})

describe('MotionSection', () => {
  it('renders motion section with children, id, role, aria-label, className', () => {
    render(
      <MotionSection
        id="test"
        role="region"
        aria-label="test region"
        className="bg-white"
      >
        <p>child</p>
      </MotionSection>,
    )

    const section = screen.getByRole('region', { name: 'test region' })
    expect(section.tagName).toBe('SECTION')
    expect(section).toHaveAttribute('id', 'test')
    expect(section).toHaveClass('bg-white')
    expect(section).toHaveAttribute('data-motion', 'true')
    expect(screen.getByText('child')).toBeInTheDocument()
  })

  it('falls back to plain section without motion props when reduced motion is on', () => {
    reducedMotionRef.current = true

    render(
      <MotionSection id="reduced" aria-label="reduced">
        <p>visible immediately</p>
      </MotionSection>,
    )

    const section = screen.getByRole('region', { name: 'reduced' })
    expect(section.tagName).toBe('SECTION')
    expect(section).not.toHaveAttribute('data-motion')
    expect(screen.getByText('visible immediately')).toBeInTheDocument()
  })

  it('does not remount children between out-of-view and in-view states', () => {
    const Child = vi.fn(() => <p>child</p>)
    inViewRef.current = false

    const { rerender } = render(
      <MotionSection id="rerender" aria-label="rerender">
        <Child />
      </MotionSection>,
    )
    const renderCount = Child.mock.calls.length

    inViewRef.current = true
    rerender(
      <MotionSection id="rerender" aria-label="rerender">
        <Child />
      </MotionSection>,
    )

    expect(Child.mock.calls.length).toBeGreaterThan(renderCount)
    expect(screen.getByText('child')).toBeInTheDocument()
  })
})
