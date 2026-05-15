---
workflowStatus: 'complete'
totalSteps: 5
stepsCompleted: ['step-01', 'step-02', 'step-03', 'step-04', 'step-05']
lastStep: 'step-05-generate-output'
lastSaved: '2026-05-15'
mode: 'epic-level'
scope: 'epic-1'
---

# Test Design: Epic 1 — Visitor Content Experience (Phase 1 MVP — Part A)

**Date:** 2026-05-15
**Author:** Murat (Test Architect) on behalf of Dev
**Status:** Draft (pending PM / Tech Lead approval)
**Mode:** Epic-Level (retrospective coverage map — all 10 stories shipped)

---

## Executive Summary

**Scope:** Epic-level test design covering the public-facing marketing site (Hero, SyncRevenue, Services, Comparison, Team, Security, Client References, Privacy Policy), three locales (EN / PT-BR / ES), routing/navigation, design system, and WCAG 2.1 AA accessibility baseline. Backend forms and lead capture are explicitly out of scope (Epic 2).

**Posture:** Epic 1 is delivered and stable (87/87 unit + jsdom-e2e tests passing, 0 TypeScript errors, 0 prod incidents, retro complete). This document is a **retrospective coverage map plus forward-looking gap closure plan** for Epic 2 onward. It does not block Epic 1 release; it sets the test baseline that Epic 2 work will inherit and must not regress.

**Risk Summary:**

- Total risks identified: **27**
- High-priority risks (score ≥ 6): **12**
- Critical (score = 9) requiring waiver: **1** (R-A2 — Electric Blue contrast — already documented exception in story 1.6)
- Critical categories: A11Y, PERF, I18N, BUS-CONTENT, OPS-TOOLING

**Coverage Summary (current actual + recommended gap closure):**

- **Already implemented**: 87 tests across 20 files (Vitest + Testing Library + jsdom)
- **P0 scenarios (must add)**: 6 (~12 hours)
- **P1 scenarios (must add)**: 18 (~18 hours)
- **P2 scenarios (nice to add)**: 22 (~11 hours)
- **P3 scenarios (on demand)**: 10 (~2.5 hours)
- **Total new effort to close gaps**: ~56 scenarios, **~43.5 hours (~5.5 days)** of test engineering

---

## Not in Scope

| Item | Reasoning | Mitigation |
| ---- | --------- | ---------- |
| Backend API tests (`/api/demo`, `/api/contact`) | No endpoints implemented in Epic 1 (FR9–FR16 belong to Epic 2) | Covered in Epic 2 test design |
| Database tests (better-sqlite3, DAO) | No schema deployed yet (deferred to Story 2.1) | Covered in Epic 2 test design |
| Admin panel auth / leads dashboard | Phase 3 scope (Epic 4) | Covered in Epic 4 test design |
| SEO / OG / sitemap / hreflang tags | Phase 2 scope (Story 3.3) | Covered in Epic 3 test design |
| Real production content (team photos, real client agency names) | Phase 2 scope (Story 3.1); Story 1.9 ships authorized placeholders | R-B1 mitigation — pre-prod content audit gate |
| Cookie banner, analytics | Out of MVP scope per PRD; Privacy Policy states "no analytics/tracking cookies at MVP" | Privacy contract test (R-B2) enforces this commitment |
| Commission Audit lead magnet | Phase 2 (Story 3.5) | Covered in Epic 3 test design |

---

## Risk Assessment

Scoring: **probability (1–3) × impact (1–3) = score (1–9)**. Thresholds: 9 = BLOCK, 6–8 = MITIGATE, 4–5 = MONITOR, 1–3 = DOCUMENT.

### Critical Risks (Score = 9)

| Risk ID | Cat | Description | P | I | Score | Action | Status |
| ------- | --- | ----------- | - | - | ----- | ------ | ------ |
| **R-A2** | A11Y | Electric Blue `#0075F0` measures 4.37:1 on white — fails WCAG AA for normal text. Eyebrow uses brand-deep `#0055F0` (4.7:1) as documented exception. Risk recurs if any future story uses `#0075F0` for body text. | 3 | 3 | 9 | WAIVED (documented) → MITIGATE going forward | Open |

### High-Priority Risks (Score 6–8)

| Risk ID | Cat | Description | P | I | Score | Mitigation | Owner |
| ------- | --- | ----------- | - | - | ----- | ---------- | ----- |
| R-I1 | I18N | Locale key drift between EN / PT-BR / ES translation files (87 tests cover top-level keys; nested key drift still possible) | 2 | 3 | 6 | Expand `src/i18n/index.test.ts` contract: assert deep key parity across all three locales recursively | DEV |
| R-A3 | A11Y | Mobile overlay (Navbar hamburger) keyboard nav — focus trap, Escape close, body scroll lock, viewport-resize listener — not enumerated in AC, found in review; regression risk on future changes | 2 | 3 | 6 | Add Playwright (real-browser) e2e: open menu, Tab through, Escape closes, focus returns to trigger | QA |
| R-P1 | PERF | LCP > 2.5s on 4G mobile (NFR-P1). Paid-ad landing traffic is bounce-sensitive. No perf gate exists. | 2 | 3 | 6 | Add Lighthouse CI gate on PR-to-main: LCP ≤ 2.5s mobile, CLS < 0.1, TBT < 200ms | DEV |
| R-P2 | PERF | CLS > 0.1 on lazy section load or locale swap (NFR-P3) — SectionSkeleton partially mitigates but unverified | 2 | 3 | 6 | Lighthouse CI CLS gate + targeted CLS test: swap locale on Home, assert no layout shift > 0.05 | DEV |
| R-B1 | BUS | Story 1.9 placeholder agency names (authorized by Pri) ship to prod inadvertently; PRD says "named US travel agencies" — placeholders are a regulatory/marketing claim risk | 2 | 3 | 6 | Add "production content readiness" gate (manual checklist in `vault/Planning/`); add automated assertion that ClientReferences names match the approved-content allowlist; surface in `bmad-check-implementation-readiness` | PM |
| R-B2 | BUS | Privacy Policy legal commitments drift between EN / PT-BR / ES (LGPD, CCPA, 24-month retention, no analytics, GDS-creds-never-collected) | 2 | 3 | 6 | Already partially covered (story 1.10 contract test); extend to assert each legal commitment is present *verbatim semantically* in all three locales (key-presence + minimum word/length sanity) | QA |
| R-B3 | BUS | Translation mistranslation (especially legal/Privacy + GDS terms); only Dev reviewed translations | 3 | 2 | 6 | Native-speaker review gate before any future translation edit; capture review evidence in vault | PM |
| R-O1 | OPS | No visual-regression baseline (Percy / Chromatic / Playwright snapshots). Brand tokens, gradient buttons, SectionHeader subtext can regress silently. | 3 | 2 | 6 | Add Playwright screenshot tests for: Hero (3 locales × 3 viewports), Footer, Navbar (open + closed mobile), Privacy (3 locales). Baseline once, fail-on-diff on PR. | QA |
| R-O2 | OPS | No real-browser e2e (all e2e is jsdom). Story 1.6 manual QA was blocked by sandbox port binding. Cross-browser bugs (Safari, mobile WebKit) invisible. | 3 | 2 | 6 | Adopt Playwright with `chromium` + `webkit` + `mobile-chrome` projects. Migrate the existing `Home.story-1-*.e2e.test.tsx` jsdom tests into real-browser specs over time. | QA |
| R-O3 | OPS | No automated a11y scan (axe-core / pa11y) in CI. ARIA / landmark / contrast regressions ship undetected. | 3 | 2 | 6 | Add `@axe-core/playwright` scan on `/` and `/privacy` × 3 locales × 2 viewports. Fail on `serious` or `critical`. | QA |
| R-O4 | OPS | No Lighthouse CI / web-vitals gate (paired with R-P1, R-P2 — same tool, separate risk because gating is separate from measuring) | 3 | 2 | 6 | Lighthouse CI in GitHub Actions on PR-to-main; budgets: perf ≥ 90 mobile, a11y = 100, best-practices ≥ 95 | DEV |
| R-T5 | TECH | Mobile overlay a11y completeness (auto-focus + focus trap + viewport-resize) is implemented but not test-enforced; any Navbar refactor can break it | 2 | 3 | 6 | Covered by R-A3 mitigation (same Playwright spec) | QA |

### Medium-Priority Risks (Score 3–5)

| Risk ID | Cat | Description | P | I | Score | Action |
| ------- | --- | ----------- | - | - | ----- | ------ |
| R-I2 | I18N | `localStorage.setItem` fails in private browsing / quota errors → locale state desync (patch already applied per retro) | 2 | 2 | 4 | MONITOR — add unit test that mocks throwing `setItem` and asserts no crash + in-memory state stays consistent |
| R-I4 | I18N | Locale switch causes CLS > 0 because PT-BR / ES strings are longer than EN | 2 | 2 | 4 | MONITOR — covered partially by R-P2 |
| R-A1 | A11Y | "Skip to main content" link broken / not first focusable | 2 | 2 | 4 | MONITOR — add Playwright spec: Tab once from page load, assert focused element matches `a[href="#main-content"]`, Enter moves focus to `<main>` |
| R-A5 | A11Y | Heading hierarchy regression (h1 in Hero, h2 in sections) — SectionHeader has no `as` prop per deferred work | 2 | 2 | 4 | MONITOR — axe + custom test: exactly one `<h1>` per route; section landmarks all carry `<h2>` heading |
| R-A6 | A11Y | `prefers-reduced-motion` not honored on radial glow / button hover / SectionSkeleton pulse | 2 | 2 | 4 | MONITOR — visual + computed-style spec: motion-safe class strips animation when `(prefers-reduced-motion: reduce)` is set |
| R-T1 | TECH | ErrorBoundary fallback copy hardcoded English ("Failed to load section.") — class component cannot use `useTranslation` | 3 | 1 | 3 | DOCUMENT — accept current limitation; revisit if/when error-boundary becomes function component or uses i18next.t directly |
| R-T2 | TECH | SectionHeader `[&>p]` override is DOM-shape-dependent; regressed subtext color in 3 stories | 2 | 2 | 4 | MONITOR — add SectionHeader render test asserting subtext color token; add ESLint rule banning unscoped `[&>p]` in component styles |
| R-T3 | TECH | `t(..., { returnObjects: true })` returns `unknown`; every consumer repeats `Array.isArray()` guard | 2 | 2 | 4 | MONITOR — extract a typed `useTranslatedArray<T>(key)` helper to centralize the guard; covered by unit tests of that helper |
| R-T4 | TECH | Missing `defaultValue` on `t()` calls (recurring review finding) | 3 | 1 | 3 | DOCUMENT — add ESLint rule (custom or via eslint-plugin-i18next) to require `defaultValue` |
| R-T7 | TECH | `<a href="/#hero">` from non-home pages triggers full reload — by-design per spec | 3 | 1 | 3 | DOCUMENT — accept; revisit when SPA-aware section nav lands |
| R-P3 | PERF | Render-blocking `@import` for Google Fonts in `src/index.css` (deferred work item) | 2 | 2 | 4 | MONITOR — move to `<link rel="preconnect">` + `<link rel="preload">` in `index.html`; covered by Lighthouse CI |

### Low-Priority Risks (Score 1–3)

| Risk ID | Cat | Description | P | I | Score | Action |
| ------- | --- | ----------- | - | - | ----- | ------ |
| R-I3 | I18N | First-load locale detection picks wrong language (edge browser locales) | 1 | 2 | 2 | DOCUMENT |
| R-A4 | A11Y | `aria-current` / `aria-label` on LanguageSwitcher buttons | 1 | 2 | 2 | DOCUMENT — already covered by existing `LanguageSwitcher.test.tsx` |
| R-B4 | BUS | GDS list accuracy (Amadeus / Sabre / Galileo / Worldspan) across locales | 1 | 2 | 2 | DOCUMENT |
| R-T6 | TECH | No SPA scroll restoration on route change | 2 | 1 | 2 | DOCUMENT — pre-existing per retro |
| R-P4 | PERF | Bundle-size bloat from lazy chunks growing over time | 2 | 1 | 2 | DOCUMENT — add bundle-size budget in Vite output as P3 |

### Risk Category Legend

- **TECH** — Technical / Architecture
- **A11Y** — Accessibility (WCAG 2.1 AA)
- **PERF** — Performance / Web Vitals
- **I18N** — Internationalization / locale parity
- **BUS** — Business / Content correctness
- **OPS** — Tooling / CI / observability

---

## Entry Criteria

- [x] Epic 1 stories 1.1 – 1.10 marked `done` in `sprint-status.yaml`
- [x] All 87 existing tests passing on master
- [x] Epic 1 retrospective complete
- [x] Deferred-work log captured
- [ ] Playwright (real-browser) toolchain decision approved by Tech Lead (currently jsdom-only)
- [ ] Lighthouse CI tooling decision approved (GitHub Actions vs. local-only)
- [ ] Visual regression tool choice approved (Playwright screenshots vs. Percy / Chromatic)

## Exit Criteria (for the gap-closure work this document recommends)

- [ ] All P0 scenarios passing on every commit (smoke + i18n contract + WCAG contrast)
- [ ] All P1 scenarios passing on PR-to-main
- [ ] P2 scenarios passing nightly (or weekly)
- [ ] R-A2 contrast waiver documented in `vault/Planning/Architecture-Key.md` (not just inside story 1.6 file)
- [ ] R-B1 placeholder content gate added to `bmad-check-implementation-readiness` skill output
- [ ] Native-speaker translation review evidence captured in `vault/Planning/` for at least one locale (R-B3 mitigation)

---

## Test Coverage Plan

### Existing Coverage (Baseline — 87 tests, 20 files)

| Area | Files | Notes |
| ---- | ----- | ----- |
| i18n init + key parity (top-level) | `src/i18n/index.test.ts` | EN/PT-BR/ES top-level keys asserted |
| LanguageSwitcher | `src/i18n/LanguageSwitcher.test.tsx` | aria-current, change flow, localStorage write |
| Locale store | `src/store/useLocaleStore.test.ts` | Initial state + changeLocale |
| Home page | `src/pages/Home.test.tsx`, `Home.story-1-6.e2e.test.tsx`, `.story-1-7`, `.story-1-8`, `.story-1-9` | Section order, lazy load + Suspense, i18n key coverage per section |
| Privacy page | `src/pages/Privacy.test.tsx`, `Privacy.story-1-10.e2e.test.tsx` | All 3 locales, required commitments, footer nav + back, scroll preservation |
| Component tests (Hero, GradientButton, SectionHeader, SectionSkeleton, ErrorBoundary, Navbar) | scattered under `src/components/` | Per story 1.2–1.4 implementations |

### P0 — Critical (run on every commit, < 5 min)

Run order: smoke → P0. **Criteria:** blocks any visitor's first paint OR scores ≥ 7 OR is a non-negotiable compliance check.

| # | Requirement | Test Level | Risk Link | Owner | Notes |
| - | ----------- | ---------- | --------- | ----- | ----- |
| P0-1 | Smoke: `/` and `/privacy` mount without console errors in default locale (EN) | E2E (Playwright, real browser) | R-O2, R-T1 | QA | Replaces sandbox manual QA from story 1.6 |
| P0-2 | i18n deep-key parity across EN / PT-BR / ES (recursive key set equality, not just top-level) | Unit (vitest) | R-I1 | DEV | Extends existing `src/i18n/index.test.ts` |
| P0-3 | WCAG contrast guard: token-by-token assertion that any color paired with `bg-white` or `bg-brand-offwhite` for normal-weight body text passes 4.5:1; explicit `expect(false).toBe(false)` waiver for `#0075F0` with comment linking R-A2 | Unit (vitest) | R-A2 | DEV | Lock the documented exception |
| P0-4 | Privacy Policy required commitments (LGPD, CCPA, 24-month retention, no analytics, no GDS-creds-on-website) present in all 3 locales | Unit (vitest, existing extended) | R-B2 | QA | Extend existing test to length/word-count sanity |
| P0-5 | Real-browser smoke for mobile overlay open + close (hamburger → menu → Esc) | E2E (Playwright, mobile-chrome) | R-A3, R-T5 | QA | Sanity-test focus trap |
| P0-6 | axe-core scan on `/` (EN) — zero `serious` / `critical` violations | E2E (Playwright + @axe-core/playwright) | R-O3 | QA | Single fast check; expand to PT-BR / ES in P1 |

**Total P0:** 6 scenarios, ~12 hours (Playwright bootstrap cost dominates first three)

### P1 — High (run on PR-to-main, < 30 min)

| # | Requirement | Test Level | Risk Link | Owner | Notes |
| - | ----------- | ---------- | --------- | ----- | ----- |
| P1-1 | Locale switch happy path on `/` (EN → PT-BR → ES → EN) — all section copy updates without reload | E2E (Playwright, chromium) | R-I1 | QA | |
| P1-2 | Locale switch on `/privacy` does not change `pathname` and does not reset scroll | E2E (Playwright) | R-I1, R-T6 | QA | Mirrors existing jsdom test in real browser |
| P1-3 | LanguageSwitcher writes `i18nextLng` to localStorage; private-browsing simulation (Storage quota throws) does not crash app | Unit (vitest with mocked storage) | R-I2 | DEV | |
| P1-4 | Mobile overlay focus trap: Tab cycles inside overlay, Shift+Tab cycles back, Esc closes + focus returns to hamburger | E2E (Playwright, mobile-chrome) | R-A3, R-T5 | QA | |
| P1-5 | Skip-to-main link is first tab stop on page load, becomes visible on focus, activates focus into `<main>` | E2E (Playwright) | R-A1 | QA | |
| P1-6 | Heading hierarchy: exactly one `<h1>` per route; all `<section>` landmarks contain `<h2>` | E2E (Playwright DOM query) | R-A5 | QA | |
| P1-7 | `prefers-reduced-motion: reduce` strips animation classes from radial glow + SectionSkeleton pulse + GradientButton hover | E2E (Playwright with emulated reduced motion) | R-A6 | QA | |
| P1-8 | axe-core scan on `/` × {PT-BR, ES} | E2E (Playwright + axe) | R-O3 | QA | |
| P1-9 | axe-core scan on `/privacy` × {EN, PT-BR, ES} | E2E (Playwright + axe) | R-O3 | QA | |
| P1-10 | Lighthouse CI: mobile perf ≥ 90, LCP ≤ 2.5s, CLS < 0.1 on `/` | CI (Lighthouse CI action) | R-P1, R-P2, R-O4 | DEV | |
| P1-11 | Lighthouse CI: same gate on `/privacy` | CI | R-P1, R-P2, R-O4 | DEV | |
| P1-12 | Section render order on `/`: Hero → SyncRevenue → Services → Comparison → Team → Security → ClientReferences → DemoScheduler → Contact | Unit (existing jsdom + new Playwright DOM order) | — | DEV | Existing test stays; Playwright adds real-render confirmation |
| P1-13 | Footer Privacy link uses React Router (no full reload), browser back returns to `/` | E2E (Playwright) | — | QA | Existing jsdom test mirrored in real browser |
| P1-14 | SectionHeader subtext color is `text-brand-deep` and does not regress when `[&>p]` overrides are added elsewhere | Unit (vitest, computed styles) | R-T2 | DEV | |
| P1-15 | GradientButton variants `lg` / `md` / `sm` render correct padding + font-size; disabled state has 50% opacity + cursor-not-allowed; focus-visible ring visible on dark bg | Unit (existing extended) | — | DEV | |
| P1-16 | ClientReferences agency names match an allowlist file under `vault/Planning/`; ship-stopper if list contains placeholder marker `[PLACEHOLDER]` | Unit (vitest) | R-B1 | PM + DEV | Production content gate |
| P1-17 | Visual regression baselines: Hero, Footer, Navbar (open + closed mobile), Privacy — 3 locales × 2 viewports (375 / 1280) | E2E (Playwright screenshots) | R-O1 | QA | Baseline once; fail-on-diff thereafter |
| P1-18 | LanguageSwitcher hover/focus states keyboard-operable; Tab/Enter selects locale | E2E (Playwright) | R-A4 | QA | Extends existing jsdom coverage |

**Total P1:** 18 scenarios, ~18 hours

### P2 — Medium (run nightly or weekly, < 60 min)

| # | Requirement | Test Level | Risk Link | Owner |
| - | ----------- | ---------- | --------- | ----- |
| P2-1 | Responsive snapshots for each of the 8 sections at 375 / 768 / 1280 px | E2E (Playwright screenshots) | R-O1 | QA |
| P2-2 | Lazy-section failure path: simulate dynamic-import rejection → ErrorBoundary fallback renders without breaking surrounding layout | Unit (vitest with mocked import) | R-T1 | DEV |
| P2-3 | `t()` `defaultValue` lint rule passes (custom ESLint or eslint-plugin-i18next) | Lint (CI) | R-T4 | DEV |
| P2-4 | Unscoped `[&>p]` ESLint rule passes (no unscoped attribute selector in `className`) | Lint (CI) | R-T2 | DEV |
| P2-5 | Hero CTA scroll target exists (`#demo-scheduler`) on `/` so the CTA does not 404-scroll | Unit | — | DEV |
| P2-6 | Trust chips render in correct layout at 479 / 480 / 768 / 1024 px (scroll / 2×2 / row) | E2E (Playwright × 4 viewports) | — | QA |
| P2-7 | StatRow stacks vertically below 640px and shows gradient text on values | E2E (Playwright) | — | QA |
| P2-8 | ComparisonTable horizontal scroll active below 768px; no clipped cells | E2E (Playwright) | — | QA |
| P2-9 | Team section: each member entry in all 3 locales has `name`, `role`, `bio`, `photo` (and no missing keys) | Unit (vitest) | R-I1 | DEV |
| P2-10 | Security section: section uses `aria-labelledby`; trust statements are text, not image-only | Unit + axe | — | QA |
| P2-11 | Privacy Policy: scroll position retained when locale changes mid-page (jsdom `scrollY` already covered; mirror in real browser) | E2E (Playwright) | R-I1, R-T6 | QA |
| P2-12 | Navbar sticky positioning at scroll > 200px | E2E (Playwright) | — | QA |
| P2-13 | Footer renders all required pieces: address, copyright, nav links, LanguageSwitcher, Privacy link | Unit (vitest, existing) | — | DEV |
| P2-14 | Translation array helper (`useTranslatedArray<T>`) — if introduced per R-T3 mitigation — has unit coverage for `Array.isArray` guard, empty, single, multi cases | Unit (vitest) | R-T3 | DEV |
| P2-15 | Brand token export check: `bg-gradient-brand`, `bg-brand-navy`, `text-brand-offwhite`, etc., resolve to the documented hex values | Unit (computed-style snapshot) | R-A2, R-T2 | DEV |
| P2-16 | `<a href="/#hero">` from `/privacy` correctly navigates back to `/` and scrolls (by-design full reload) | E2E (Playwright) | R-T7 | QA |
| P2-17 | `prefers-color-scheme` (if site eventually supports light/dark) — placeholder test currently `it.todo()` | E2E todo | — | QA |
| P2-18 | Font display: Plus Jakarta Sans loads with `font-display: swap` | Unit (computed-style) | R-P3 | DEV |
| P2-19 | All `<button>` elements have explicit `type="button"` (form-submit safety, even though no forms yet) | Lint or unit | — | DEV |
| P2-20 | LCP / CLS / TBT collected on a per-section basis (lazy chunk impact analysis) — informational | CI (Lighthouse CI per-page) | R-P1, R-P2 | DEV |
| P2-21 | `aria-label`s on hamburger toggle change between "Open menu" and "Close menu" | E2E | R-A3 | QA |
| P2-22 | Tab order through Navbar (logo → nav links → LanguageSwitcher → Demo CTA → main) is deterministic | E2E | R-A3 | QA |

**Total P2:** 22 scenarios, ~11 hours

### P3 — Low (on-demand)

| # | Requirement | Test Level | Owner |
| - | ----------- | ---------- | ----- |
| P3-1 | Bundle-size budget per route chunk (e.g., `Home.*.js` ≤ 250 KB gzip; `Privacy.*.js` ≤ 60 KB gzip) | CI (vite-plugin-size or `bundlesize`) | DEV |
| P3-2 | Browser-matrix smoke: Safari Tech Preview, Firefox latest, mobile WebKit | E2E (Playwright cross-project) | QA |
| P3-3 | Slow-3G + CPU throttle Lighthouse run | CI | DEV |
| P3-4 | `aria-current="true"` on active locale across all routes | E2E | QA |
| P3-5 | Translation length stress (German / Russian-style 1.5× expansion stub) — placeholder for future locale | Unit (mock locale) | DEV |
| P3-6 | Visual diff for SectionSkeleton across themes | E2E screenshot | QA |
| P3-7 | Tabnabbing safety on any `target="_blank"` (rel="noopener noreferrer") | Unit (DOM scan) | DEV |
| P3-8 | favicon / OG defaults present (pre-SEO story 3.3) | Unit (HTML head scan) | DEV |
| P3-9 | Helmet / meta description present (pre-SEO) | Unit | DEV |
| P3-10 | Mobile rotation (portrait ↔ landscape) does not break Navbar overlay | E2E | QA |

**Total P3:** 10 scenarios, ~2.5 hours

---

## Execution Order

### Smoke Tests (< 2 min) — run first in CI

- [ ] P0-1 — `/` + `/privacy` mount, no console errors (EN only, chromium only)
- [ ] P0-2 — i18n deep-key parity (unit, fast)
- [ ] P0-3 — WCAG contrast guard (unit, fast)

### P0 Tests (< 5 min cumulative)

- [ ] P0-4 — Privacy commitments × 3 locales (unit)
- [ ] P0-5 — Mobile overlay open + close (real browser)
- [ ] P0-6 — axe scan on `/` (EN)

### P1 Tests (< 30 min cumulative) — PR-to-main gate

All 18 P1 scenarios. Lighthouse CI runs in parallel with Playwright matrix.

### P2 Tests (< 60 min) — nightly schedule

All 22 P2 scenarios. Bundle-size delta posted as PR comment but non-blocking until P3 budget approved.

### P3 Tests — on-demand or pre-release

All 10 P3 scenarios.

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours / Test | Total Hours | Notes |
| -------- | ----- | ------------ | ----------- | ----- |
| P0 | 6 | 2.0 | 12 | Playwright bootstrap + first-time Lighthouse CI setup |
| P1 | 18 | 1.0 | 18 | Standard Playwright + axe + visual baseline |
| P2 | 22 | 0.5 | 11 | Most are extensions of existing patterns |
| P3 | 10 | 0.25 | 2.5 | Exploratory / single-shot |
| **Total** | **56** | — | **43.5** | **~5.5 engineering days** |

### Prerequisites

**Test data:** No factories needed (no backend in scope). Allowlist file under `vault/Planning/client-references-allowlist.md` for R-B1.

**Tooling (new):**

- **Playwright** (`@playwright/test`) with `chromium`, `webkit`, `mobile-chrome` projects
- **`@axe-core/playwright`** for a11y scans
- **Lighthouse CI** (`@lhci/cli`) wired into GitHub Actions
- Optional: **Percy** or **Chromatic** if Playwright screenshot baselines prove flaky; defer until R-O1 shows real flake

**Environment:**

- CI runner with headless Chromium + WebKit (GitHub Actions `ubuntu-latest` supports both)
- Lighthouse CI requires Node 20+; current `package.json` has `@types/node@25.7.0` — fine
- Real translation review evidence captured per R-B3

---

## Quality Gate Criteria

### Pass / Fail Thresholds

- **P0 pass rate:** 100% (no exceptions; failure blocks merge)
- **P1 pass rate:** ≥ 95% (waivers require documented owner + expiry)
- **P2 pass rate:** ≥ 90% (informational, posted as nightly summary)
- **High-risk mitigations:** 100% complete or approved waivers (R-A2 already waived; rest must be active mitigations before Epic 2 ships)

### Coverage Targets

- **Critical visitor journeys (`/`, `/privacy`, locale switch, mobile overlay):** ≥ 90%
- **WCAG 2.1 AA scenarios:** 100% (zero `serious`/`critical` axe violations on all 3 locales)
- **i18n parity:** 100% recursive key equality across EN / PT-BR / ES
- **Web Vitals (NFR-P1, NFR-P2, NFR-P3):** 100% pass on `/` and `/privacy` mobile

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] R-A2 waiver explicitly documented in `vault/Planning/Architecture-Key.md` (currently only in story 1.6 file)
- [ ] R-B1 placeholder content gate exists and is green before any prod deploy
- [ ] No high-risk (≥ 6) item unmitigated when Epic 2 begins (form work introduces new attack surface; we need Epic 1 baseline locked first)
- [ ] axe-core scan green on `/` and `/privacy` × 3 locales

---

## Mitigation Plans (Detail for Score ≥ 6 risks)

### R-A2: Electric Blue `#0075F0` contrast failure (Score 9 → WAIVED)

**Strategy:** Documented exception. Brand-deep `#0055F0` (4.7:1) is used for normal-weight text where contrast matters; `#0075F0` is reserved for large-text accents, gradient stops, and decorative use. P0-3 contrast guard test locks the exception in code.

**Owner:** Pri (Project Lead — authorized) + DEV (implements guard).

**Verification:** P0-3 test + manual review of any new component proposing `text-brand-electric-blue` for body text.

**Promote waiver from story file to `vault/Planning/Architecture-Key.md`** — exit criterion.

### R-I1: Locale deep-key drift (Score 6)

**Strategy:** Extend `src/i18n/index.test.ts` from top-level-only to recursive deep equality of key sets. Snapshot for each locale, compare.

**Owner:** DEV. **Timeline:** before Epic 2 starts. **Verification:** P0-2 test red on intentional drift.

### R-A3 / R-T5: Mobile overlay focus trap (Score 6)

**Strategy:** Playwright real-browser spec (P0-5 + P1-4). Cover: open → Tab cycles inside → Shift+Tab cycles back → Esc closes → focus returns to hamburger. Run on `mobile-chrome` project.

**Owner:** QA. **Timeline:** P1 sprint. **Verification:** P0-5 + P1-4.

### R-P1 / R-P2 / R-O4: Web Vitals + Lighthouse CI (Score 6 ×3)

**Strategy:** Add Lighthouse CI GitHub Action. Budget file: `lighthouserc.json` with mobile perf ≥ 90, LCP ≤ 2500ms, CLS < 0.1, TBT < 200ms, a11y = 100. Gate PR-to-main.

**Owner:** DEV. **Timeline:** Sprint 1 of Epic 2 prep. **Verification:** P1-10 + P1-11.

### R-B1: Placeholder client references (Score 6)

**Strategy:** Two-layer.
1. **Allowlist test (P1-16):** the actual rendered names must be in `vault/Planning/client-references-allowlist.md`. Story 1.9 placeholders are flagged `[PLACEHOLDER]` and that marker fails the test in `production` build.
2. **Readiness skill hook:** add a check to `bmad-check-implementation-readiness` that scans the allowlist for `[PLACEHOLDER]` and emits a `pre-release-blocker` finding.

**Owner:** PM (content) + DEV (test). **Verification:** P1-16 red on placeholder string.

### R-B2: Privacy commitment drift (Score 6)

**Strategy:** Existing story-1.10 contract test already covers required commitments by key presence in all 3 locales. Extend P0-4 with: (a) minimum character-length sanity (≥ 30 chars for legal sentences); (b) presence of locale-specific legal-term anchors (e.g., PT-BR must mention "LGPD" literally, ES must mention "CCPA" literally, EN must mention both).

**Owner:** QA. **Verification:** P0-4.

### R-B3: Translation mistranslation (Score 6)

**Strategy:** Native-speaker review evidence captured in `vault/Planning/translation-reviews/<locale>-<yyyy-mm-dd>.md` before any translation merges. Pre-merge checklist item.

**Owner:** PM. **Timeline:** Before any future translation edit. **Verification:** Manual / commit-message reference.

### R-O1: Visual regression (Score 6)

**Strategy:** Playwright screenshot baselines (P1-17) on a fixed set of components × locales × viewports. Baseline once, fail-on-diff on PR. Tolerance: ≤ 0.1% pixel diff. Update procedure documented in `vault/Code/Frontend.md`.

**Owner:** QA. **Verification:** P1-17.

### R-O2: No real-browser e2e (Score 6)

**Strategy:** Adopt Playwright. Keep existing jsdom-`e2e` tests as fast-path component tests; rename them away from `.e2e.` suffix to reduce confusion (they are not real e2e). New real-browser specs go under `tests/e2e/`.

**Owner:** QA + DEV. **Timeline:** Sprint 1 of Epic 2 prep. **Verification:** P0-1, P0-5, P0-6, all P1 e2e items.

### R-O3: No a11y CI scan (Score 6)

**Strategy:** `@axe-core/playwright` in P0-6 + P1-8 + P1-9. Configure axe with WCAG 2.1 AA tag set; ignore color-contrast on the explicit `#0075F0` exception via a documented selector allowlist.

**Owner:** QA. **Verification:** P0-6, P1-8, P1-9.

---

## Assumptions and Dependencies

### Assumptions

1. The Epic 1 retrospective findings (~50 review patches applied, 0 prod incidents, 87/87 tests green) accurately reflect current code state — verified against `git log` and `sprint-status.yaml`.
2. Playwright + Lighthouse CI tooling will be approved before Epic 2 forms work begins, because forms work multiplies the test surface and we want the marketing-site baseline locked first.
3. Native-speaker translation review can be arranged for PT-BR and ES (R-B3) — if not, the residual risk stays at 6 and must be re-scored.
4. Sandbox-environment port binding (the Story 1.6 blocker) is resolved or replaced by Playwright-in-CI for real-browser checks.

### Dependencies

1. **Playwright adoption decision** — required before P0-1, P0-5, P0-6, and all P1 e2e items. Owner: Tech Lead.
2. **Lighthouse CI GitHub Action** — required for P1-10, P1-11. Owner: DEV.
3. **`vault/Planning/client-references-allowlist.md`** — required for P1-16. Owner: PM.
4. **`bmad-check-implementation-readiness` skill update** — required to enforce R-B1 production gate end-to-end. Owner: DEV.
5. **Update `vault/Planning/Architecture-Key.md`** with R-A2 waiver and the lazy + Suspense + ErrorBoundary pattern (currently only in story files per retro section 4.2.3).

### Risks to This Plan

- **Risk:** Playwright adoption is delayed → P0-1 / P0-5 / P0-6 cannot run in real browser → R-O2 / R-O3 stay open. **Contingency:** Run axe-core inside the existing jsdom harness as a stopgap (lower fidelity but better than nothing); flag in Epic 2 retro.
- **Risk:** Lighthouse CI runtime exceeds CI budget → drop to nightly only. **Contingency:** Keep gating on PR but accept slower PR turnaround; revisit budget when Epic 2 lands.
- **Risk:** PT-BR / ES native speakers unavailable → R-B3 unresolved. **Contingency:** Engage external translation review service; document cost + timeline.

---

## Follow-on Workflows

- **`*atdd`** — generate failing red-phase specs for the P0 / P1 items that have no existing scaffold (P0-5, P0-6, P1-4, P1-5, P1-7, P1-17). Run before Epic 2 forms work begins.
- **`*automate`** — broader automation once Playwright is in place; will pick up most P2 items mechanically.
- **`*trace`** — generate the requirements-to-tests traceability matrix linking PRD FR1–FR8, FR17–FR28, and NFR-P1/P2/P3 + NFR-A1..A6 to the existing 87 tests plus the new 56 scenarios above.
- **`*nfr`** — formal NFR assessment for performance / a11y / reliability against the PRD targets.
- **`*ci`** — scaffold the Lighthouse CI + Playwright + axe pipeline.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager (Alice): __________________ Date: __________
- [ ] Tech Lead (Charlie / Winston): __________________ Date: __________
- [ ] QA Lead (Dana): __________________ Date: __________
- [ ] Project Lead (Pri): __________________ Date: __________

**Comments:**

_The author (Murat) recommends the Tech Lead and Project Lead prioritize the Playwright + Lighthouse CI tooling decisions before Epic 2 begins, because the marketing-site quality baseline is easier to lock now than after Epic 2 multiplies the surface area with form submission flows._

---

## Interworking and Regression

| Area | Impact | Regression scope (must keep green) |
| ---- | ------ | ----------------------------------- |
| **Shared components** (GradientButton, SectionHeader, SectionSkeleton, ErrorBoundary) | Used in every section, will be touched by Epic 2 forms (form-submit button = GradientButton variant) | All 87 existing tests + P1-14, P1-15 |
| **i18n infrastructure** | Epic 2 adds `forms` and `errors` namespaces with locale-aware validation copy | P0-2, P0-4, P1-1, P1-2 |
| **Routing / `<main id="main-content">`** | Epic 2 may add `/thank-you` route; skip-link target must remain | P1-5, P1-6 |
| **Privacy Policy** | Epic 2 lead-capture work must keep Privacy commitments consistent with the actual data flow it implements (R-B2) | P0-4 |
| **ClientReferences** | Epic 3 story 3.1 replaces placeholders — must update allowlist atomically | P1-16 |
| **Performance budget** | Epic 2 adds React Hook Form + Zod runtime → bundle grows; LCP/CLS budgets stay fixed | P1-10, P1-11, P3-1 |

---

## Appendix

### Knowledge Base References Loaded

- `risk-governance.md` — Risk classification framework
- `probability-impact.md` — 1–9 scoring + threshold rules
- `test-levels-framework.md` — Unit vs. component vs. e2e selection
- `test-priorities-matrix.md` — P0–P3 mapping

### Related Documents

- PRD: `_bmad-output/planning-artifacts/prd.md`
- Epic / story breakdown: `_bmad-output/planning-artifacts/epics.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Sprint status: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Epic 1 retrospective: `_bmad-output/implementation-artifacts/epic-1-retro-2026-05-15.md`
- Deferred work log: `_bmad-output/implementation-artifacts/deferred-work.md`

---

**Generated by:** BMad TEA Agent (Murat — Master Test Architect)
**Workflow:** `bmad-testarch-test-design` (Epic-Level)
**Version:** 4.0 (BMad v6)
