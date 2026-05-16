import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import GradientButton from './GradientButton'

describe('GradientButton', () => {
  it('uses a targeted transition (no transition-all) with duration-150 ease-out', () => {
    render(<GradientButton>Click</GradientButton>)
    const btn = screen.getByRole('button', { name: 'Click' })

    const className = btn.className
    expect(className).not.toMatch(/\btransition-all\b/)
    expect(className).toContain('transition-[filter,background-position,box-shadow]')
    expect(className).toContain('duration-150')
    expect(className).toContain('ease-out')
  })

  it('keeps stable size classes per size variant (no layout-affecting hover changes)', () => {
    const { rerender } = render(<GradientButton size="md">m</GradientButton>)
    expect(screen.getByRole('button').className).toContain('px-6 py-3 text-base')

    rerender(<GradientButton size="lg">l</GradientButton>)
    expect(screen.getByRole('button').className).toContain('px-8 py-4 text-lg')

    rerender(<GradientButton size="sm">s</GradientButton>)
    expect(screen.getByRole('button').className).toContain('px-4 py-2 text-sm')
  })

  it('does not include hover layout classes (width/height/padding/margin/font-size/transform)', () => {
    render(<GradientButton>x</GradientButton>)
    const className = screen.getByRole('button').className
    expect(className).not.toMatch(/hover:(?:px-|py-|p-|m-|mx-|my-|w-|h-|text-(?:xs|sm|base|lg|xl)|translate-|scale-|rotate-)/)
  })

  it('keeps focus-visible ring and disabled styling', () => {
    render(
      <GradientButton disabled aria-label="disabled-btn">
        x
      </GradientButton>,
    )
    const className = screen.getByRole('button', { name: 'disabled-btn' }).className
    expect(className).toContain('focus-visible:ring-2')
    expect(className).toContain('disabled:opacity-50')
    expect(className).toContain('disabled:cursor-not-allowed')
  })
})
