import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  describe('default variant (legacy preserved)', () => {
    it('renders with the original opacity-transition shadcn-lite class set', () => {
      render(<Button>Default</Button>)
      const btn = screen.getByRole('button', { name: 'Default' })
      const className = btn.className
      expect(className).toContain('rounded-lg')
      expect(className).toContain('px-4')
      expect(className).toContain('py-3')
      expect(className).toContain('font-semibold')
      expect(className).toContain('transition-opacity')
      expect(className).toContain('disabled:opacity-60')
    })

    it('does not render solid-accent classes', () => {
      render(<Button>Default</Button>)
      const className = screen.getByRole('button').className
      expect(className).not.toContain('bg-[var(--accent)]')
      expect(className).not.toMatch(/-translate-y-px/)
    })

    it('forwards arbitrary props (className merge, aria, onClick stub)', () => {
      render(
        <Button className="extra" aria-label="lbl">
          x
        </Button>,
      )
      const btn = screen.getByRole('button', { name: 'lbl' })
      expect(btn.className).toContain('extra')
    })
  })

  describe('solid-accent variant', () => {
    it.each(['sm', 'md', 'lg'] as const)('size=%s renders with correct radius + padding + font tokens', size => {
      render(
        <Button variant="solid-accent" size={size}>
          x
        </Button>,
      )
      const className = screen.getByRole('button').className

      // Base solid-accent fingerprint
      expect(className).toContain('bg-[var(--accent)]')
      expect(className).toContain('hover:bg-[var(--accent-soft)]')
      expect(className).toContain('text-white')

      // No gradient, no glow, no extra shadow
      expect(className).not.toMatch(/\bbg-gradient-/)
      expect(className).not.toMatch(/\bshadow-/)
      expect(className).not.toMatch(/\bdrop-shadow-/)

      // Size-specific
      if (size === 'sm') {
        expect(className).toContain('px-4')
        expect(className).toContain('py-2')
        expect(className).toContain('text-[13px]')
        expect(className).toContain('rounded-lg')
      }
      if (size === 'md') {
        expect(className).toContain('px-5')
        expect(className).toContain('py-[11px]')
        expect(className).toContain('text-sm')
        expect(className).toContain('rounded-[10px]')
      }
      if (size === 'lg') {
        expect(className).toContain('px-[26px]')
        expect(className).toContain('py-[15px]')
        expect(className).toContain('text-[15px]')
        expect(className).toContain('rounded-[14px]')
      }
    })

    it('defaults to size md when no size prop is given', () => {
      render(<Button variant="solid-accent">x</Button>)
      const className = screen.getByRole('button').className
      expect(className).toContain('rounded-[10px]')
      expect(className).toContain('py-[11px]')
    })

    it('hover lift is motion-safe and disabled state has no transform', () => {
      render(
        <Button variant="solid-accent" disabled aria-label="d">
          x
        </Button>,
      )
      const className = screen.getByRole('button', { name: 'd' }).className
      // Lift is motion-safe-gated, so reduced-motion users never see translate
      expect(className).toContain('motion-safe:hover:-translate-y-px')
      // Disabled neutralizes hover transform + hover background
      expect(className).toContain('disabled:hover:translate-y-0')
      expect(className).toContain('disabled:hover:bg-[var(--accent)]')
      expect(className).toContain('disabled:opacity-50')
      expect(className).toContain('disabled:cursor-not-allowed')
      // No unconditional translate / scale classes
      expect(className).not.toMatch(/(?:^|\s)-?translate-/)
      expect(className).not.toMatch(/(?:^|\s)scale-/)
    })

    it('exposes focus-visible ring tokens (ring-2 white/60 + transparent offset)', () => {
      render(<Button variant="solid-accent">x</Button>)
      const className = screen.getByRole('button').className
      expect(className).toContain('focus-visible:ring-2')
      expect(className).toContain('focus-visible:ring-white/60')
      expect(className).toContain('focus-visible:ring-offset-2')
      expect(className).toContain('focus-visible:ring-offset-transparent')
    })
  })
})
