import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import i18next from 'i18next'
import '@/i18n'

/**
 * R-B1 — ClientReferences allowlist contract (Test Design Epic 1).
 *
 * Every agencyName rendered by ClientReferences must appear in
 * `vault/Planning/client-references-allowlist.md`.
 *
 * In production builds (NODE_ENV === 'production'), any agencyName whose row in the
 * allowlist still carries the `[PLACEHOLDER]` marker must fail this test — placeholders
 * are pre-production-only per Pri's authorization on 2026-05-15.
 */

const ALLOWLIST_PATH = resolve(__dirname, '../../../vault/Planning/client-references-allowlist.md')
const LOCALES = ['en', 'pt-BR', 'es'] as const

type AllowlistEntry = {
  name: string
  placeholder: boolean
}

function parseAllowlist(markdown: string): AllowlistEntry[] {
  const entries: AllowlistEntry[] = []
  const sections: Array<{ placeholder: boolean; body: string }> = []

  const approvedMatch = markdown.match(/## APPROVED[\s\S]*?(?=\n##\s|$)/)
  if (approvedMatch) sections.push({ placeholder: false, body: approvedMatch[0] })

  const placeholderMatch = markdown.match(/## PLACEHOLDER[\s\S]*?(?=\n##\s|$)/)
  if (placeholderMatch) sections.push({ placeholder: true, body: placeholderMatch[0] })

  for (const section of sections) {
    const rows = section.body.split('\n').filter(line => line.trim().startsWith('|'))
    for (const row of rows) {
      const cells = row.split('|').map(c => c.trim())
      if (cells.length < 2) continue
      const nameCell = cells[1]
      if (!nameCell || nameCell.toLowerCase().startsWith('name') || /^-+$/.test(nameCell)) continue
      const cleanName = nameCell.replace(/`\[PLACEHOLDER\]`/g, '').replace(/\s+/g, ' ').trim()
      if (!cleanName) continue
      entries.push({ name: cleanName, placeholder: section.placeholder })
    }
  }

  return entries
}

function loadAllowlist(): { approved: Set<string>; placeholders: Set<string>; all: Set<string> } {
  const raw = readFileSync(ALLOWLIST_PATH, 'utf-8')
  const entries = parseAllowlist(raw)
  const approved = new Set(entries.filter(e => !e.placeholder).map(e => e.name))
  const placeholders = new Set(entries.filter(e => e.placeholder).map(e => e.name))
  const all = new Set([...approved, ...placeholders])
  return { approved, placeholders, all }
}

function renderedAgencyNames(locale: string): string[] {
  const data = i18next.getDataByLanguage(locale)?.translation as
    | { references?: { items?: Array<{ agencyName?: unknown }> } }
    | undefined
  const items = data?.references?.items
  if (!Array.isArray(items)) return []
  return items
    .map(item => (typeof item.agencyName === 'string' ? item.agencyName : ''))
    .filter(name => name.length > 0)
}

describe('ClientReferences allowlist (R-B1)', () => {
  const allowlist = loadAllowlist()

  it('every rendered agencyName across all locales appears in the allowlist', () => {
    for (const locale of LOCALES) {
      for (const name of renderedAgencyNames(locale)) {
        expect(allowlist.all.has(name), `[${locale}] "${name}" missing from vault/Planning/client-references-allowlist.md`).toBe(true)
      }
    }
  })

  it('agencyNames are consistent across EN / PT-BR / ES (same set, same order)', () => {
    const enNames = renderedAgencyNames('en')
    for (const locale of LOCALES) {
      expect(renderedAgencyNames(locale)).toEqual(enNames)
    }
  })

  it('placeholder agencyNames do not ship to production', () => {
    const isProduction = process.env.NODE_ENV === 'production'
    const renderedPlaceholders: string[] = []
    for (const name of renderedAgencyNames('en')) {
      if (allowlist.placeholders.has(name)) renderedPlaceholders.push(name)
    }

    if (isProduction) {
      expect(renderedPlaceholders, `Placeholders in production build: ${renderedPlaceholders.join(', ')}`).toHaveLength(0)
    } else {
      expect(allowlist.placeholders.size).toBeGreaterThanOrEqual(0)
    }
  })

  it('forbids vague placeholder language in rendered names', () => {
    const VAGUE = [/a leading TMC/i, /recognized agency/i, /undisclosed/i, /TBD/i, /TODO/i]
    for (const locale of LOCALES) {
      for (const name of renderedAgencyNames(locale)) {
        for (const pattern of VAGUE) {
          expect(name).not.toMatch(pattern)
        }
      }
    }
  })
})
