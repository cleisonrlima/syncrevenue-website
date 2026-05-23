# Story 7.8 TEA Baseline

Date: 2026-05-23

## Vitest Coverage

Command: `npm run test:coverage`

| Metric | Value |
|--------|-------|
| Test files | 102 passed |
| Tests | 868 passed |
| Statements | 88.69% |
| Branches | 78.94% |
| Functions | 91.27% |
| Lines | 91.40% |

## Lighthouse

Collected from production preview on `http://localhost:4174` with local Chromium.

| Route | Profile | Perf | A11y | Best Practices | SEO |
|-------|---------|------|------|----------------|-----|
| `/` | desktop | 99 | 100 | 96 | 100 |
| `/` | mobile | 74 | 100 | 96 | 100 |
| `/v2` | desktop | 90 | 96 | 96 | 100 |
| `/v2` | mobile | 55 | 96 | 96 | 100 |
| `/dashboard` | desktop | 98 | 94 | 96 | 100 |
| `/dashboard` | mobile | 66 | 94 | 93 | 100 |

## Axe Counts

Command source: Playwright + `@axe-core/playwright` against production preview. The existing documented R-A2 `color-contrast` exception is disabled in the scanner.

| Route | Critical | Serious | Moderate | Minor |
|-------|----------|---------|----------|-------|
| `/v2` | 0 | 0 | 0 | 0 |
| `/demo` | 0 | 0 | 0 | 0 |
| `/dashboard` | 0 | 0 | 0 | 0 |
| `/dashboard/recovery` | 0 | 0 | 0 | 0 |
| `/dashboard/payouts` | 0 | 0 | 0 | 0 |
| `/dashboard/insights` | 0 | 0 | 0 | 0 |
| `/dashboard/settings` | 0 | 0 | 0 | 0 |

## Verification

- `npm run typecheck` exits 0.
- `npm run build` exits 0 with no chunk-size warning.
- `npm run test:coverage` exits 0.
- `npx playwright test tests/e2e/a11y-axe.spec.ts --project=chromium --workers=1` exits 0.
- `npx playwright test tests/e2e/v2-to-demo.spec.ts tests/e2e/dashboard-nav.spec.ts --project=mobile-chrome --workers=1` exits 0.
