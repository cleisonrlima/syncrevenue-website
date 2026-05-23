# Axe Accessibility Sweep — Epic 7 (Story 7.7 AC 5)

Date: 2026-05-23
Test file: `tests/e2e/a11y-axe.spec.ts`
Runner: `@axe-core/playwright` v4.11.3
Standard: WCAG 2.1 AA (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`)
Excluded rules: none — `color-contrast` is active for this Story 7.7 sweep.

## Routes Scanned

| Route | Locales | Critical/Serious Violations | Status |
|-------|---------|----------------------------|--------|
| `/` | en, pt-BR, es | 0 | PASS |
| `/privacy` | en, pt-BR, es | 0 | PASS |
| `/admin/login` | en | 0 | PASS |
| `/admin/dashboard` | en | 0 | PASS |
| `/admin/leads` | en | 0 | PASS |
| `/admin/team` | en | 0 | PASS |

## Admin Routes

Admin routes (`/admin/dashboard`, `/admin/leads`, `/admin/team`) require authentication for meaningful axe scanning. The Playwright axe spec now stubs the admin session and read-only admin API responses so the authenticated UI states render deterministically for axe.

The admin Login page is scanned directly without stubs. A real axe contrast failure was found on the sign-in button (`#0075F0` + white, 4.37:1) and patched to `bg-brand-deep` before the final passing run.

## Violations Summary

| Violation ID | Impact | Count | Triage |
|---|---|---|---|
| None | — | 0 | — |

## Moderate / Minor Violations

None detected on the scanned routes.

## Conclusion

Zero serious/critical violations across all six required routes (AC 5 satisfied). No follow-up story required for axe findings.
