# Story 1.11: Test Infrastructure Baseline (Epic 1 Gap Closure)

Status: done
baseline_commit: 7829564
type: tech-debt / quality-baseline

## Story

As the test architect (Murat) and the project lead (Pri),
we want a real-browser e2e harness, automated WCAG and Web-Vitals gates, deep i18n parity coverage, and a single source of truth for placeholder client-reference content,
so that Epic 2 (lead capture and form submissions) inherits a locked quality baseline and cannot silently regress Epic 1 deliverables.

## Context

Epic 1 (stories 1.1 – 1.10) shipped 87 passing tests under Vitest + jsdom and zero production incidents. The Epic 1 retrospective (`_bmad-output/implementation-artifacts/epic-1-retro-2026-05-15.md`) plus the formal Test Design (`_bmad-output/test-artifacts/test-design/test-design-epic-1.md`, 27 risks scored) identified 12 high-priority gaps that need closing before Epic 2's larger surface area (forms, SMTP, rate limiting, security headers) lands.

This story closes the Tier-1 subset of those gaps. Scope is deliberately narrow: install tooling, scaffold the highest-value specs, lock the known waivers, and document the rest as deferred work for Epic 2 + Epic 3.

## Acceptance Criteria

1. **Given** the Test Design Epic 1 risk register, **when** the codebase is inspected, **then** the following risks are mitigated with code or documentation in this story (not deferred):
   - R-A2 (Electric Blue contrast waiver) — documented in `vault/Planning/Architecture-Key.md` AND locked by an automated contrast test.
   - R-I1 (deep-key drift across EN / PT-BR / ES) — recursive key-shape parity test passes.
   - R-B1 (placeholder client agency names shipping to production) — `vault/Planning/client-references-allowlist.md` exists and is enforced by an automated allowlist test that fails in `NODE_ENV === 'production'` when any placeholder marker remains.
   - R-O2 (no real-browser e2e) — Playwright is installed and a minimum smoke spec exists.
   - R-O3 (no a11y CI scan) — `@axe-core/playwright` is wired into a real-browser spec.
   - R-O4 / R-P1 / R-P2 (no Lighthouse / Web-Vitals gate) — Lighthouse CI configs exist for desktop and mobile presets.
   - R-A3 / R-T5 (mobile overlay focus trap untested) — a Playwright spec for hamburger open / Esc close / focus trap exists.

2. **Given** the existing 87-test Vitest baseline, **when** `npm run test:run` is executed, **then** all baseline tests still pass and the new tests added by this story bring the total to **99/99 passing**.

3. **Given** TypeScript strict mode, **when** `npm run typecheck` is executed, **then** zero errors are reported.

4. **Given** the new Playwright harness, **when** the repository is freshly cloned, **then** `npm install && npm run test:e2e:install && npm run test:e2e` is the documented bootstrap path; the harness includes desktop chromium + webkit and mobile chromium + webkit projects; specs live under `tests/e2e/`; Vitest is configured to exclude `tests/e2e/**` so the two harnesses do not collide.

5. **Given** Lighthouse CI configuration, **when** `npm run lhci` and `npm run lhci:mobile` are executed against a built preview server, **then** the configured budgets are: performance ≥ 90, accessibility = 100, best-practices ≥ 95, LCP ≤ 2500ms, CLS < 0.1, TBT < 200ms.

6. **Given** GitHub Actions, **when** a PR is opened against `master`, **then** the `quality.yml` workflow runs three jobs (unit, e2e, lighthouse) and uploads the Playwright HTML report as an artifact on failure.

7. **Given** the vault is the canonical orientation surface for AI agents, **when** an agent reads the vault, **then** `vault/00-Home.md`, `vault/Code/Index.md`, `vault/Code/Frontend.md`, `vault/Planning/Architecture-Key.md`, and `vault/Planning/Epics-Index.md` are updated to reflect the new tooling, test counts, R-A2 waiver, R-B1 enforcement, and the Test Design Epic 1 artifact location.

8. **Given** browser binaries are not committed to the repository, **when** the developer or CI needs to run Playwright, **then** the bootstrap script `npm run test:e2e:install` downloads chromium + webkit on demand; this story does not require browsers to be downloaded in the sandbox where it was authored.

## Tasks / Subtasks

- [x] Task 1: Produce Test Design Epic 1 artifact (AC: all)
  - [x] Run the BMad TEA `*test-design` workflow at Epic level
  - [x] Output `_bmad-output/test-artifacts/test-design/test-design-epic-1.md` with 27 risks scored P × I (1–9), tiered into BLOCK / MITIGATE / MONITOR / DOCUMENT
  - [x] Output `_bmad-output/test-artifacts/test-design/test-design-progress.md` workflow state

- [x] Task 2: Lock the R-A2 Electric Blue contrast waiver (AC: 1, 7)
  - [x] Promote the exception from story 1.6 review notes into `vault/Planning/Architecture-Key.md` under a new "WCAG Contrast Exceptions" section
  - [x] Add `src/lib/brand-tokens.contrast.test.ts`: 7 assertions covering brand-deep on white, brand-deep on offwhite, offwhite on navy, white on navy, and the documented `#0075F0` failure with bounded ratio (≥ 3:1 large-text, < 4.5:1 normal-text)

- [x] Task 3: Extend i18n deep-key parity (AC: 1, 2)
  - [x] Add `shapeOf()` recursive key-shape helper to `src/i18n/index.test.ts`
  - [x] Add `expectDeepKeyParity()` helper; add two assertions (pt-BR vs en, es vs en)
  - [x] Existing top-level parity tests retained

- [x] Task 4: Create client references allowlist contract (AC: 1, 7)
  - [x] Author `vault/Planning/client-references-allowlist.md` with sections APPROVED / PLACEHOLDER / Update procedure / Rejection procedure
  - [x] Populate with the three Pri-authorized 2026-05-15 placeholders (Atlas Travel Group, Pacific Sun Voyages, Northstar Travel Partners)
  - [x] Add `src/components/sections/ClientReferences.allowlist.test.tsx`: parses the vault markdown, asserts every rendered `agencyName` from `t('references.items')` across EN / PT-BR / ES exists in the allowlist; fails on placeholders when `NODE_ENV === 'production'`; rejects vague placeholder language (`a leading TMC`, `recognized agency`, `TBD`, etc.)

- [x] Task 5: Install and scaffold Playwright + axe (AC: 1, 4, 6)
  - [x] `npm install -D @playwright/test @axe-core/playwright`
  - [x] `playwright.config.ts` with chromium / webkit / mobile-chrome / mobile-webkit projects, `webServer` auto-start, `PLAYWRIGHT_BASE_URL` override
  - [x] `tests/e2e/smoke.spec.ts` — P0-1: `/` and `/privacy` mount without console errors
  - [x] `tests/e2e/a11y-axe.spec.ts` — P0-6 / P1-8 / P1-9: WCAG 2.1 AA scan × 2 routes × 3 locales, with `color-contrast` disabled to honor the R-A2 documented exception
  - [x] `tests/e2e/mobile-overlay.spec.ts` — P0-5 / P1-4: hamburger open + Esc close + focus trap, Pixel 7 device
  - [x] `tests/e2e/locale-switch.spec.ts` — P1-1 / P1-2: locale switch on `/` and `/privacy` without navigation; scroll preservation
  - [x] `tests/e2e/skip-link.spec.ts` — P1-5: skip-to-main is first tab stop
  - [x] Add scripts `test:e2e`, `test:e2e:headed`, `test:e2e:install` to `package.json`
  - [x] Exclude `tests/e2e/**` from Vitest in `vite.config.ts` so the two harnesses do not collide
  - [x] Add `playwright-report/`, `test-results/`, `.lighthouseci/` to `.gitignore`

- [x] Task 6: Install and scaffold Lighthouse CI (AC: 1, 5, 6)
  - [x] `npm install -D @lhci/cli`
  - [x] `lighthouserc.json` — desktop preset, asserts perf ≥ 90, a11y = 100, best-practices ≥ 95, LCP ≤ 2500ms, CLS < 0.1, TBT < 200ms; runs against `vite preview` on port 4173
  - [x] `lighthouserc.mobile.json` — mobile preset with the same web-vitals budgets
  - [x] Add scripts `lhci`, `lhci:mobile` to `package.json`

- [x] Task 7: GitHub Actions workflow (AC: 6)
  - [x] `.github/workflows/quality.yml` with three jobs: `unit` (typecheck + Vitest), `e2e` (Playwright + axe), `lighthouse` (LHCI desktop + mobile)
  - [x] `e2e` and `lighthouse` depend on `unit`
  - [x] Upload `playwright-report/` as an artifact on failure

- [x] Task 8: Vault update protocol (AC: 7)
  - [x] `vault/Planning/Architecture-Key.md` — append "WCAG Contrast Exceptions" (R-A2), "Canonical Frontend Patterns" (lazy + Suspense + ErrorBoundary trio, translation-array normalization, SectionHeader override, motion-safe + reduced-motion, locale flow restated)
  - [x] `vault/Planning/Epics-Index.md` — add Test Design Epic 1 reference line under Epic 1
  - [x] `vault/00-Home.md` — update test count (99/99), add tooling note, update carry-forward debt with R-B1 + R-A2 enforcement references
  - [x] `vault/Code/Index.md` — add "New since Epic 1 retrospective" block with Test Design + new test files + Playwright + LHCI + CI workflow + allowlist
  - [x] `vault/Code/Frontend.md` — append "Testing Infrastructure" section detailing Vitest, Playwright, LHCI, CI, and risk traceability

- [x] Task 9: Validation
  - [x] `npm run test:run` — 22 files / 99 tests pass
  - [x] `npm run typecheck` — zero errors
  - [x] Playwright browsers NOT downloaded in author sandbox (network blocked); CI installs them via `--with-deps`; local devs run `npm run test:e2e:install` once

## Review Findings

(none — this story is self-contained tooling + documentation; no production code paths added beyond the test harness itself)

## Dev Notes

### Why this is Story 1.11 and not Story 2.0

The Tier-1 gaps closed here are entirely about *protecting Epic 1 deliverables* (i18n parity, WCAG contrast, mobile overlay a11y, client-reference content governance) from regression once Epic 2 begins editing shared components. Conceptually this is Epic 1 hardening, not Epic 2 setup. Story 2.0 / 2.1 will own backend test infrastructure (DAO + route + middleware tests) which is a different concern.

### Deferred to later stories

Items from the Test Design Epic 1 doc that are NOT in this story (see the artifact for full list, IDs and owners):

- **P1-16 stays partially open**: the allowlist contract test exists, but the `bmad-check-implementation-readiness` skill is not yet patched to surface a `pre-release-blocker` finding when the allowlist still has placeholders. Add in Epic 5 (Production Deployment) prep, story 5.1 or earlier.
- **P1-3** (localStorage private-browsing test) — small, can land alongside any Epic 2 form-state work.
- **P1-7** (`prefers-reduced-motion` spec) — defer to Epic 3 (animations & micro-interactions) story 3.2 where the motion surface expands.
- **P1-17** (visual regression baselines) — defer until Playwright screenshot flake characteristics are known on the chosen CI runner; revisit at Epic 2 end-of-sprint.
- **P3-2** (cross-browser matrix: Firefox + Safari Tech Preview) — defer until Epic 5.
- **R-B3** (native-speaker translation review) — process change; PM-owned, not engineering-blocking.

### Risk traceability

| Risk ID | Score | Closed by | Status |
| ------- | ----- | --------- | ------ |
| R-A2 | 9 (waived) | Task 2 + vault update | Waiver locked |
| R-A3 / R-T5 | 6 | Task 5 (mobile-overlay spec) | Spec scaffolded; runs in CI |
| R-B1 | 6 | Task 4 + Task 8 | Allowlist + test live; readiness skill hook deferred |
| R-I1 | 6 | Task 3 | Closed |
| R-O1 | 6 | — | Deferred (visual regression baselines) |
| R-O2 | 6 | Task 5 | Closed (harness in place; specs grow over time) |
| R-O3 | 6 | Task 5 (axe spec) | Closed |
| R-O4 / R-P1 / R-P2 | 6 each | Task 6 + Task 7 | Closed |
| R-B2 / R-B3 | 6 each | — | Partial (R-B2 covered by existing privacy contract; R-B3 process change deferred) |

### Files touched

**New:**

- `_bmad-output/test-artifacts/test-design/test-design-epic-1.md`
- `_bmad-output/test-artifacts/test-design/test-design-progress.md`
- `vault/Planning/client-references-allowlist.md`
- `src/lib/brand-tokens.contrast.test.ts`
- `src/components/sections/ClientReferences.allowlist.test.tsx`
- `playwright.config.ts`
- `tests/e2e/smoke.spec.ts`
- `tests/e2e/a11y-axe.spec.ts`
- `tests/e2e/mobile-overlay.spec.ts`
- `tests/e2e/locale-switch.spec.ts`
- `tests/e2e/skip-link.spec.ts`
- `lighthouserc.json`
- `lighthouserc.mobile.json`
- `.github/workflows/quality.yml`

**Edited:**

- `src/i18n/index.test.ts` (added `shapeOf` + `expectDeepKeyParity` + two assertions)
- `package.json` (5 new scripts; 3 new devDependencies)
- `vite.config.ts` (exclude `tests/e2e/**`)
- `.gitignore` (Playwright + LHCI artifacts)
- `vault/Planning/Architecture-Key.md`
- `vault/Planning/Epics-Index.md`
- `vault/00-Home.md`
- `vault/Code/Index.md`
- `vault/Code/Frontend.md`

### Source artifacts

- Test design (this story's primary input): `_bmad-output/test-artifacts/test-design/test-design-epic-1.md`
- Epic 1 retrospective: `_bmad-output/implementation-artifacts/epic-1-retro-2026-05-15.md`
- Deferred work log: `_bmad-output/implementation-artifacts/deferred-work.md`
