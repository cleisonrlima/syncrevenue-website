import { describe, it, expect } from 'vitest'
import { cn } from './cn'
import { cn as cnFromUtils } from './utils'

/**
 * Story 7.1 (AC 4) — cn helper re-export.
 *
 * `@/lib/cn` is the Figma-convention path the imported shadcn components
 * (stories 7.3+) will use; `@/lib/utils` is the legacy path the Epic 1–6
 * consumers use. Both must resolve to the same `cn` function so any future
 * test mock targeting either path is consistent and any future refactor
 * collapsing one path does not introduce subtle behavioural drift.
 */
describe('cn helper (@/lib/cn re-export)', () => {
  it('is the same function reference as @/lib/utils.cn (referential equality)', () => {
    expect(cn).toBe(cnFromUtils)
  })

  it('joins simple class strings with a single space', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('merges duplicate Tailwind utilities so the last value wins (twMerge contract)', () => {
    // `px-2` and `px-4` are mutually exclusive Tailwind utilities; tailwind-merge
    // should keep only the last one.
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('drops falsy values (clsx contract)', () => {
    expect(cn('a', false, null, undefined, 0 as unknown as string, 'b')).toBe('a b')
  })

  it('flattens nested arrays of class values', () => {
    expect(cn(['a', 'b'], ['c', ['d']])).toBe('a b c d')
  })
})
