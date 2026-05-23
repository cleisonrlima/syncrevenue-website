import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = path.join(repoRoot, 'src', 'lib', 'brand-tokens.contrast.manifest.ts')

// Token hexes mirror src/index.css CSS custom properties (the authoritative source).
const TOKENS = {
  'electric-blue': '#0075F0',
  highlight:       '#00A0F0',
  deep:            '#0055F0',
  navy:            '#0D0D3A',
  slate:           '#404070',
  muted:           '#8080A0',
  offwhite:        '#F4F6FA',
  white:           '#FFFFFF',
  // Sober palette refresh (Epic 6 — 2026-05-17). New surfaces / accents.
  // `ink` is the new dark text-bearing surface (deeper than navy). `accent` is the sober blue.
  ink:             '#0A0B2E',
  accent:          '#3D6FE0',
}

// Audit scope: every brand foreground on the text-bearing surface tokens used in production.
// Non-surface brand colors are not text-bearing backgrounds; adding one requires extending this list.
// `ink` joins the surface set (new dark surface introduced in Epic 6).
const SURFACES = ['white', 'offwhite', 'navy', 'ink']
const FOREGROUNDS = Object.keys(TOKENS)

const EPIC7_DARK_TOKENS = {
  background: 'oklch(0.145 0 0)',
  foreground: 'oklch(0.985 0 0)',
  card: 'oklch(0.145 0 0)',
  'card-foreground': 'oklch(0.985 0 0)',
  popover: 'oklch(0.145 0 0)',
  'popover-foreground': 'oklch(0.985 0 0)',
  primary: 'oklch(0.985 0 0)',
  'primary-foreground': 'oklch(0.205 0 0)',
  secondary: 'oklch(0.269 0 0)',
  'secondary-foreground': 'oklch(0.985 0 0)',
  muted: 'oklch(0.269 0 0)',
  'muted-foreground': 'oklch(0.708 0 0)',
  accent: 'oklch(0.269 0 0)',
  'accent-foreground': 'oklch(0.985 0 0)',
  destructive: 'oklch(0.396 0.141 25.723)',
  'destructive-foreground': 'oklch(0.985 0 0)',
  sidebar: 'oklch(0.205 0 0)',
  'sidebar-foreground': 'oklch(0.985 0 0)',
  'sidebar-primary': 'oklch(0.488 0.243 264.376)',
  'sidebar-primary-foreground': 'oklch(0.985 0 0)',
  'sidebar-accent': 'oklch(0.269 0 0)',
  'sidebar-accent-foreground': 'oklch(0.985 0 0)',
}

const EPIC7_DARK_TEXT_PAIRS = [
  ['foreground', 'background'],
  ['card-foreground', 'card'],
  ['popover-foreground', 'popover'],
  ['primary-foreground', 'primary'],
  ['secondary-foreground', 'secondary'],
  ['muted-foreground', 'muted'],
  ['accent-foreground', 'accent'],
  ['destructive-foreground', 'destructive'],
  ['sidebar-foreground', 'sidebar'],
  ['sidebar-primary-foreground', 'sidebar-primary'],
  ['sidebar-accent-foreground', 'sidebar-accent'],
]

// Waivers — see vault/Planning/Architecture-Key.md → "WCAG Contrast Exceptions".
// R-A2: electric-blue family decorative accents.
// R-A3: sober accent #3D6FE0 — AA Large only on dark surfaces (Epic 6).
// R-M1: muted token is helper-text only — passes AA Large.
// R-NT1: structural non-text pairs within the text-surface audit scope.
const WAIVERS = {
  'electric-blue|white':    { id: 'R-A2',  reason: 'Electric Blue reserved for large text only, gradient stops, decorative accents.' },
  'electric-blue|offwhite': { id: 'R-A2',  reason: 'Electric Blue reserved for large text only, gradient stops, decorative accents.' },
  'electric-blue|navy':     { id: 'R-A2',  reason: 'Electric Blue on navy is a decorative accent (gradient stops, hairlines); reserve for large text only on dark surfaces.' },
  'electric-blue|ink':      { id: 'R-A2',  reason: 'Electric Blue on ink remains in the R-A2 decorative family; reserved for large text on dark surfaces.' },
  'highlight|white':        { id: 'R-A2',  reason: 'Highlight #00A0F0 is the same decorative blue family as electric-blue — reserve for large text, gradient stops, decorative accents.' },
  'highlight|offwhite':     { id: 'R-A2',  reason: 'Highlight #00A0F0 is the same decorative blue family as electric-blue — reserve for large text, gradient stops, decorative accents.' },
  'highlight|ink':          { id: 'R-NT1', reason: 'Legacy gradient stop never paired with ink in production (ink is Epic 6-only).' },
  'muted|white':            { id: 'R-M1',  reason: 'Muted #8080A0 reserved for de-emphasized helper text and meta labels — passes AA Large only.' },
  'muted|offwhite':         { id: 'R-M1',  reason: 'Muted #8080A0 reserved for de-emphasized helper text and meta labels — passes AA Large only.' },
  'muted|ink':              { id: 'R-NT1', reason: 'Legacy muted not paired with ink — Epic 6 dark surfaces use muted-token / offwhite.' },
  'offwhite|white':         { id: 'R-NT1', reason: 'Surface-on-surface pair; never used for text in production.' },
  'white|offwhite':         { id: 'R-NT1', reason: 'Surface-on-surface pair; never used for text in production.' },
  'deep|navy':              { id: 'R-NT1', reason: 'Brand-deep is a light-surface accent; not paired on dark navy surfaces in production.' },
  'deep|ink':               { id: 'R-NT1', reason: 'Brand-deep is a light-surface accent; never paired on ink in production.' },
  'slate|navy':             { id: 'R-NT1', reason: 'Slate is a mid-tone label for light surfaces only; dark surfaces use offwhite or white.' },
  'slate|ink':              { id: 'R-NT1', reason: 'Slate is a light-surface label; ink dark surface uses offwhite or white.' },
  // R-A3: sober accent on dark surfaces — passes AA Large only.
  'accent|navy':            { id: 'R-A3',  reason: 'Sober accent #3D6FE0 on navy ≈ 3.97:1 — passes AA Large, reserved for large/decorative usage on dark surfaces (Epic 6).' },
  'accent|ink':             { id: 'R-A3',  reason: 'Sober accent #3D6FE0 on ink ≈ 4.10:1 — passes AA Large only; same R-A3 reservation as accent-on-navy.' },
  'accent|white':           { id: 'R-A3',  reason: 'Sober accent #3D6FE0 on white ≈ 4.65:1 — borderline AA Normal; treat as R-A3 accent usage (large/decorative preferred) until Epic 6 light-surface contrast pass.' },
  'accent|offwhite':        { id: 'R-A3',  reason: 'Sober accent #3D6FE0 on offwhite — same R-A3 reservation as accent-on-white.' },
  // ink (new dark surface) foregrounds on existing surfaces — ink is treated as decorative-only text on light surfaces.
  'ink|white':              { id: 'R-NT1', reason: 'Ink is a dark surface token; never used as foreground on light surfaces in production.' },
  'ink|offwhite':           { id: 'R-NT1', reason: 'Ink is a dark surface token; never used as foreground on light surfaces in production.' },
  'ink|navy':               { id: 'R-NT1', reason: 'Surface-on-surface pair; ink and navy are both dark surfaces — never text in production.' },
  'navy|ink':               { id: 'R-NT1', reason: 'Surface-on-surface pair; ink and navy are both dark surfaces — never text in production.' },
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ]
}

function oklchToRgb(value) {
  const match = value.match(/^oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)$/)
  if (!match) throw new Error(`Unsupported OKLCH value: ${value}`)

  const L = Number(match[1])
  const C = Number(match[2])
  const h = Number(match[3]) * Math.PI / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)

  const l = L + 0.3963377774 * a + 0.2158037573 * b
  const m = L - 0.1055613458 * a - 0.0638541728 * b
  const s = L - 0.0894841775 * a - 1.2914855480 * b

  const l3 = l ** 3
  const m3 = m ** 3
  const s3 = s ** 3

  const linearRgb = [
    +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3,
  ]

  return linearRgb.map(channel => {
    const clamped = Math.min(1, Math.max(0, channel))
    const srgb = clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * (clamped ** (1 / 2.4)) - 0.055
    return Math.round(srgb * 255)
  })
}

function tokenToRgb(value) {
  if (value.startsWith('#')) return hexToRgb(value)
  if (value.startsWith('oklch(')) return oklchToRgb(value)
  throw new Error(`Unsupported color token: ${value}`)
}

function rgbToHex([r, g, b]) {
  return `#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

function relativeLuminance(value) {
  const [r, g, b] = tokenToRgb(value).map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(fg, bg) {
  const L1 = relativeLuminance(fg)
  const L2 = relativeLuminance(bg)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

const entries = []
for (const fg of FOREGROUNDS) {
  for (const bg of SURFACES) {
    if (fg === bg) continue
    const fgHex = TOKENS[fg]
    const bgHex = TOKENS[bg]
    const rawRatio = contrastRatio(fgHex, bgHex)
    const ratio = Number(rawRatio.toFixed(2))
    const aaNormal = rawRatio >= 4.5
    const aaLarge = rawRatio >= 3.0
    const waiver = WAIVERS[`${fg}|${bg}`] ?? null
    entries.push({ fg, bg, fgHex, bgHex, ratio, aaNormal, aaLarge, waiver })
  }
}

const epic7Entries = []
for (const [fg, bg] of EPIC7_DARK_TEXT_PAIRS) {
  const fgValue = EPIC7_DARK_TOKENS[fg]
  const bgValue = EPIC7_DARK_TOKENS[bg]
  const rawRatio = contrastRatio(fgValue, bgValue)
  const ratio = Number(rawRatio.toFixed(2))
  epic7Entries.push({
    fg,
    bg,
    fgHex: rgbToHex(tokenToRgb(fgValue)),
    bgHex: rgbToHex(tokenToRgb(bgValue)),
    ratio,
    aaNormal: rawRatio >= 4.5,
    aaLarge: rawRatio >= 3.0,
    waiver: null,
  })
}

entries.sort((a, b) => {
  if (a.fg !== b.fg) return a.fg.localeCompare(b.fg)
  return a.bg.localeCompare(b.bg)
})

const unwaivedFailures = entries.filter(e => !e.aaNormal && e.waiver === null)
const epic7UnwaivedFailures = epic7Entries.filter(e => !e.aaNormal && e.waiver === null)

const generatedOn = new Date().toISOString().slice(0, 10)
const header = `// AUTO-GENERATED by scripts/check-brand-contrast.mjs. Do not edit by hand — run \`npm run check:contrast\`.
// Generated on: ${generatedOn}
// Audit scope: brand foregrounds on production text-bearing surfaces (white, offwhite, navy, ink).
// Source-of-truth for token hexes: src/index.css (CSS custom properties).
// Waivers documented in: vault/Planning/Architecture-Key.md → WCAG Contrast Exceptions.

export interface BrandContrastWaiver {
  id: string
  reason: string
}

export interface BrandContrastEntry {
  fg: string
  bg: string
  fgHex: string
  bgHex: string
  ratio: number
  aaNormal: boolean
  aaLarge: boolean
  waiver: BrandContrastWaiver | null
}

export const BRAND_CONTRAST_MANIFEST: BrandContrastEntry[] = [
`

const body = entries
  .map(e => {
    const waiverLiteral = e.waiver === null
      ? 'null'
      : `{ id: ${JSON.stringify(e.waiver.id)}, reason: ${JSON.stringify(e.waiver.reason)} }`
    return `  { fg: ${JSON.stringify(e.fg)}, bg: ${JSON.stringify(e.bg)}, fgHex: ${JSON.stringify(e.fgHex)}, bgHex: ${JSON.stringify(e.bgHex)}, ratio: ${e.ratio.toFixed(2)}, aaNormal: ${e.aaNormal}, aaLarge: ${e.aaLarge}, waiver: ${waiverLiteral} },`
  })
  .join('\n')

const epic7Body = epic7Entries
  .map(e => `  { fg: ${JSON.stringify(e.fg)}, bg: ${JSON.stringify(e.bg)}, fgHex: ${JSON.stringify(e.fgHex)}, bgHex: ${JSON.stringify(e.bgHex)}, ratio: ${e.ratio.toFixed(2)}, aaNormal: ${e.aaNormal}, aaLarge: ${e.aaLarge}, waiver: null },`)
  .join('\n')

const footer = `
]

export const EPIC7_DARK_CONTRAST_MANIFEST: BrandContrastEntry[] = [
${epic7Body}
]
`

fs.writeFileSync(manifestPath, header + body + footer, 'utf8')

console.log(`Brand contrast manifest written: ${path.relative(repoRoot, manifestPath)}`)
console.log(`  entries: ${entries.length}`)
console.log(`  AA-normal pass: ${entries.filter(e => e.aaNormal).length}`)
console.log(`  waivered: ${entries.filter(e => e.waiver).length}`)
console.log(`  Epic 7 dark entries: ${epic7Entries.length}`)
console.log(`  Epic 7 AA-normal pass: ${epic7Entries.filter(e => e.aaNormal).length}`)

if (unwaivedFailures.length > 0 || epic7UnwaivedFailures.length > 0) {
  console.error('\nUnwaived WCAG AA-normal failures detected:')
  for (const e of unwaivedFailures) {
    console.error(`  ${e.fg} on ${e.bg}: ratio ${e.ratio} (aaLarge: ${e.aaLarge})`)
  }
  for (const e of epic7UnwaivedFailures) {
    console.error(`  Epic 7 dark ${e.fg} on ${e.bg}: ratio ${e.ratio} (aaLarge: ${e.aaLarge})`)
  }
  console.error('\nEither (a) fix the token, (b) add a waiver to scripts/check-brand-contrast.mjs WAIVERS table, or (c) remove the pair from auditing.')
  process.exit(1)
}
