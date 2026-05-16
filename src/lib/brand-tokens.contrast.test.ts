import { describe, it, expect } from 'vitest'
import { BRAND_CONTRAST_MANIFEST } from './brand-tokens.contrast.manifest'

/**
 * R-A2 contrast guard (Test Design Epic 1).
 *
 * Electric Blue #0075F0 measures 4.37:1 on white — fails WCAG AA for normal-weight body text (≥ 4.5:1).
 * Documented exception: reserve #0075F0 for large-text only, gradient stops, decorative accents.
 * Body text on light backgrounds MUST use brand-deep #0055F0 (≈ 4.7:1).
 *
 * See: vault/Planning/Architecture-Key.md → "WCAG Contrast Exceptions" → R-A2.
 */

const BRAND_TOKENS = {
  electricBlue: '#0075F0',
  highlight: '#00A0F0',
  deep: '#0055F0',
  navy: '#0D0D3A',
  slate: '#404070',
  muted: '#8080A0',
  offwhite: '#F4F6FA',
  white: '#FFFFFF',
} as const

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ]
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(fg: string, bg: string): number {
  const L1 = relativeLuminance(fg)
  const L2 = relativeLuminance(bg)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('Brand token contrast (WCAG 2.1 AA)', () => {
  it('brand-deep on white passes AA normal text (≥ 4.5:1)', () => {
    const ratio = contrastRatio(BRAND_TOKENS.deep, BRAND_TOKENS.white)
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('brand-deep on offwhite passes AA normal text (≥ 4.5:1)', () => {
    const ratio = contrastRatio(BRAND_TOKENS.deep, BRAND_TOKENS.offwhite)
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('offwhite on navy passes AA normal text (≥ 4.5:1)', () => {
    const ratio = contrastRatio(BRAND_TOKENS.offwhite, BRAND_TOKENS.navy)
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('white on navy passes AA normal text (≥ 4.5:1)', () => {
    const ratio = contrastRatio(BRAND_TOKENS.white, BRAND_TOKENS.navy)
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  /**
   * R-A2 — Locked exception. Electric Blue on white is the known WCAG AA miss.
   * If this snapshot changes, either the hex moved (update the exception) or
   * the token was darkened (in which case promote it to body text and remove this allowance).
   */
  it('electric-blue on white is the documented WCAG AA exception (R-A2)', () => {
    const ratio = contrastRatio(BRAND_TOKENS.electricBlue, BRAND_TOKENS.white)
    expect(ratio).toBeLessThan(4.5)
    expect(ratio).toBeGreaterThanOrEqual(3.0)
    expect(ratio).toBeCloseTo(4.37, 1)
  })

  it('electric-blue passes AA large-text on white (≥ 3:1)', () => {
    const ratio = contrastRatio(BRAND_TOKENS.electricBlue, BRAND_TOKENS.white)
    expect(ratio).toBeGreaterThanOrEqual(3.0)
  })
})

describe('Brand contrast manifest', () => {
  it('every entry without a waiver passes WCAG AA normal text', () => {
    const unwaivedFailures = BRAND_CONTRAST_MANIFEST.filter(
      e => !e.aaNormal && e.waiver === null,
    )
    expect(unwaivedFailures).toEqual([])
  })

  it('electric-blue on white carries the R-A2 waiver', () => {
    const entry = BRAND_CONTRAST_MANIFEST.find(
      e => e.fg === 'electric-blue' && e.bg === 'white',
    )
    expect(entry).toBeDefined()
    expect(entry!.aaNormal).toBe(false)
    expect(entry!.aaLarge).toBe(true)
    expect(entry!.waiver?.id).toBe('R-A2')
  })

  it('every entry ratio matches the math within 0.05 tolerance', () => {
    for (const e of BRAND_CONTRAST_MANIFEST) {
      const recomputed = contrastRatio(e.fgHex, e.bgHex)
      expect(Math.abs(recomputed - e.ratio)).toBeLessThan(0.05)
    }
  })
})
