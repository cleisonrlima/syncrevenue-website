# Story 7.7: Prerender Exclusions + Site-Wide Dark Mode Regression Sweep

Status: done

Epic: 7 — Figma 'teste' SaaS Import — Dashboard Suite + Dark Theme

Source: Local files only. Key files: `scripts/prerender.tsx` (Story 5.6 SSG prerender), `scripts/check-brand-contrast.mjs` (Story 3.9 contrast guard), `lighthouserc.json` + `lighthouserc.mobile.json`, `src/pages/Home.tsx`, `src/pages/Privacy.tsx`, `src/pages/admin/*.tsx`, `src/components/sections/*` (30+ section components).

Depends on: Stories 7.1 (dark mode default + token backport) + 7.2 (routes) + 7.3 (dashboard pages) + 7.4 (Landing + Demo) + 7.5 (i18n) + 7.6 (brand copy) — must all be merged so the regression sweep operates on the final state.

## Story

As the engineer accountable for the project's CLAUDE.md "must not break Vitest suite / SSG prerender / Lighthouse baselines" guarantees,
I want explicit prerender exclusions for the new dynamic routes AND a comprehensive regression sweep over every existing page now that the site is forced into dark mode,
So that the Epic 7 imports do not silently regress Story 6.13 LCP work, Story 5.6 prerender, the 89-files / 772-passing Vitest baseline, or the WCAG-AA contrast guard — and any breaks are surfaced as story-level rebaseline decisions, not hidden as drift.

## Acceptance Criteria

1. **Given** `scripts/prerender.tsx` currently only renders `/` **When** Epic 7 routes are added **Then** the prerender script is updated with an explicit exclusion list (`EXCLUDED_ROUTES = ['/admin', '/admin/*', '/privacy', '/404', '/v2', '/demo', '/dashboard', '/dashboard/*']` per the inline doc comment at lines 14–22) and a defensive check that warns if a NEW route is registered in `src/App.tsx` without an explicit inclusion or exclusion entry. The defensive check is a `console.warn` (not a fail) for the first sprint, then upgraded to a fail in a follow-up.

2. **Given** dark mode is forced site-wide per Story 7.1 **When** `npm run dev` boots and each existing page is visited (`/`, `/privacy`, `/admin/login`, `/admin/dashboard`, `/admin/leads`, `/admin/team`) **Then** each page renders without visual regression: text legible (no white-on-white or near-black-on-near-black), CTAs visible, Hero LCP image (Story 6.13) still loads with correct priority, focus rings on form inputs remain visible, all existing Vitest snapshot/visual tests pass (update snapshots if intentional palette shift — document in the story).

3. **Given** `scripts/check-brand-contrast.mjs` checks WCAG-AA against the existing brand tokens **When** Epic 7 dark mode lands **Then** the contrast manifest is re-run and any new violations are surfaced. Surface a new waiver entry (e.g., `R-A4 — Epic 7 dark palette: deprecate light-only token X for surface Y`) for each waiver-able violation; for each non-waiver-able violation, file a follow-up story under "Review Findings → New Story".

4. **Given** Lighthouse CI runs `npm run lhci` (`lighthouserc.json`) + `npm run lhci:mobile` (`lighthouserc.mobile.json`) **When** the post-Epic-7 build is measured **Then** perf / a11y / best-practices / SEO scores are recorded against the existing thresholds; any drop ≥ 0.05 below threshold triggers either (a) targeted fix in this story (e.g. hero image priority) OR (b) explicit baseline re-drop with documented rationale per Story 6.12 precedent. The "force dark site-wide" decision is allowed to re-baseline if dark palette intrinsically affects scores.

5. **Given** axe accessibility scan is part of the Playwright suite **When** axe runs over `/`, `/privacy`, `/admin/login`, `/admin/dashboard`, `/admin/leads`, `/admin/team` post-Epic-7 **Then** zero serious/critical violations remain. Moderate/minor violations are documented in `_bmad-output/test-artifacts/axe-epic-7-sweep.md` and triaged: trivial → patch in this story; non-trivial → new follow-up story.

6. **Given** existing Vitest tests for `/` (Home sections), `/privacy`, `/admin/*` exist (~30+ tests) **When** the site is in forced-dark mode **Then** every test passes after snapshot updates (intentional palette shift) OR after targeted patches (unintentional regression). Snapshot updates committed as a single commit with `[snapshot] Epic 7 dark mode rebase` message so review can diff what changed.

7. **Given** the regression sweep is the highest-risk story of Epic 7 **When** review runs **Then** the cross-model reviewer (per CLAUDE.md "Cross-Model Review Mandatory") audits the diff of `tailwind.config.ts`, `src/index.css`, every existing component touched by snapshot updates, and the Lighthouse + axe reports. Sign-off required before merge.

## Tasks / Subtasks

- [x] **Task 1: Prerender exclusion list + defensive warn (AC: 1)**
  - [x] Edit `scripts/prerender.tsx`: introduce `EXCLUDED_ROUTES` constant + `INCLUDED_ROUTES = ['/']` set
  - [x] Add iteration over registered routes (via static import of `src/App.tsx` route config OR a manual sync list) that warns if any route is in neither set
  - [x] Verify `npm run build` still produces `dist/client/index.html` with the prerendered Hero markup for `/` only

- [x] **Task 2: Manual dark-mode smoke per existing route (AC: 2)**
  - [x] `npm run dev`; visit `/`, `/privacy`, `/admin/login`, `/admin/dashboard`, `/admin/leads`, `/admin/team`
  - [x] Record findings: capture full-page screenshots → `_bmad-output/test-artifacts/dark-mode-regression-epic-7/`
  - [x] Triage each finding: patch-in-story vs. baseline-re-drop vs. new follow-up story

- [x] **Task 3: Contrast manifest re-run (AC: 3)**
  - [x] Run `npm run check:contrast`
  - [x] For each new violation: add waiver entry to `scripts/check-brand-contrast.mjs` `WAIVERS` block OR file a follow-up
  - [x] Update `src/lib/brand-tokens.contrast.test.ts` + `src/lib/brand-tokens.contrast.manifest.ts` accordingly
  - [x] Update `vault/Planning/Architecture-Key.md` "WCAG Contrast Exceptions" section with the new waivers

- [x] **Task 4: Lighthouse re-baseline (AC: 4)**
  - [x] `npm run lhci` against the post-Epic-7 build
  - [x] `npm run lhci:mobile` against the post-Epic-7 build
  - [x] If perf/a11y drops, decide: targeted fix vs. re-baseline; document
  - [x] Update `lighthouserc.json` / `lighthouserc.mobile.json` if re-baselining; commit message includes the rationale

- [x] **Task 5: Axe sweep (AC: 5)**
  - [x] `npm run test:e2e` Playwright suite with axe-core integration (per Story 3.9 setup)
  - [x] Capture violations to `_bmad-output/test-artifacts/axe-epic-7-sweep.md`
  - [x] Triage per AC 5

- [x] **Task 6: Vitest snapshot rebase (AC: 6)**
  - [x] `npm run test:run` — identify failing snapshot tests
  - [x] For each: confirm regression is intentional (dark palette) → `npm run test:run -- -u` to update snapshot; or unintentional → patch in this story
  - [x] Single dedicated commit for the snapshot update with audit-trail message

- [x] **Task 7: Cross-model review (AC: 7)**
  - [x] Reviewer agent (non-Claude if dev = Claude) audits diff + reports + screenshots
  - [x] Sign-off recorded in story Dev Agent Record
  - [x] Findings → new story per "Review Findings → New Story" if non-trivial

### Review Findings

- [x] [Review][Patch] Admin axe coverage is incomplete [tests/e2e/a11y-axe.spec.ts:19] — AC 5 requires axe coverage over `/`, `/privacy`, `/admin/login`, `/admin/dashboard`, `/admin/leads`, and `/admin/team`, but the current axe spec only scans `/` and `/privacy`; the committed axe report also says admin routes were manually inspected instead of scanned. Add automated Playwright axe coverage for the login page and authenticated admin pages, then regenerate the axe report from actual results.
- [x] [Review][Patch] Dark-mode smoke lacks screenshot evidence [_bmad-output/test-artifacts/dark-mode-regression-epic-7/dark-mode-regression-report.md:4] — Task 2 requires full-page screenshots under `_bmad-output/test-artifacts/dark-mode-regression-epic-7/`, but the committed artifact directory contains only the Markdown report and the Dev Agent Record says the audit used code inspection and server-rendered output analysis. Capture and commit screenshots for all required routes and update the report with references.
- [x] [Review][Patch] Prerender route guard cannot detect newly registered App routes [scripts/prerender.tsx:95] — AC 1 requires a defensive warning when a new route is registered in `src/App.tsx` without an inclusion or exclusion decision, but the implementation checks only a manually maintained `KNOWN_ROUTES` list and wildcard placeholders. Add a shared route registry or a static check/test that derives registered routes from `src/App.tsx` and verifies wildcard-aware inclusion/exclusion coverage.
- [x] [Review][Patch] Epic 7 dark-token contrast remains outside automated coverage [scripts/check-brand-contrast.mjs:10] — AC 3 and the story Dev Notes call out the need to cover Epic 7 OKLCH tokens, but the contrast script still audits only legacy brand tokens and the axe spec disables `color-contrast` globally. Extend the contrast guard or add a committed Epic 7 dark-token contrast report, and replace global axe contrast disabling with scoped waivers or targeted fixes.
- [x] [Review][Patch] Lighthouse scores are not recorded in committed evidence [_bmad-output/implementation-artifacts/7-7-prerender-exclusions-dark-mode-regression.md:104] — AC 4 requires perf, accessibility, best-practices, SEO, and threshold/drop decisions to be recorded, but the diff only records that assertions passed and commits no Story 7.7 LHCI summary artifact. Commit a small desktop/mobile Lighthouse summary with route, mode, category scores, LCP/CLS/TBT, thresholds, and rebaseline decision.
- [x] [Review][Patch] Cross-model review sign-off is not yet complete [_bmad-output/implementation-artifacts/7-7-prerender-exclusions-dark-mode-regression.md:67] — AC 7 requires cross-model review sign-off before merge; this review produced unresolved patch findings, so sign-off cannot be recorded yet. Resolve or explicitly defer the findings, then update Task 7 and the Dev Agent Record with the reviewer outcome.

## Dev Notes

### Open reconciliations (resolve at create-time → 2026-05-22)

1. **Story 6.13 LCP work risk.** Story 6.13 closed mobile LCP at 2,259ms (↓83% from 2,916ms baseline) and reverted `lighthouserc.mobile.json` LCP threshold to 2,500ms. Forced dark mode on `/` ALONE should not regress LCP (palette change does not move the rendered hero image), but render-blocking CSS additions from Story 7.1 (tw-animate-css + new tokens) might add KB to the critical path. Watch the LCP number specifically.

2. **`scripts/check-brand-contrast.mjs` token coverage.** The script enumerates `TOKENS` and `SURFACES` explicitly. Epic 7 tokens (Figma OKLCH set) need to be added to the enumeration for the manifest to cover them. Without this, the script silently passes by ignoring the new tokens — defeating the audit.

3. **Existing dark mode in Epic 6.** Story 6.1 introduced the sober palette tokens. Some Epic 6 surfaces may already be effectively dark (Hero overlay, etc.). The site-wide `<html class="dark">` should NOT regress those. Audit by diffing screenshots pre-Epic-7 vs. post-Epic-7 of every existing page.

4. **`AdminLayout` (Epic 4).** The admin panel is internal-facing — visual quality bar is lower than public site but functional correctness is non-negotiable. Confirm Login form usable in dark mode (input contrast, error message visibility).

### Out of scope

- New per-page OG images for dark theme (separate follow-up)
- Refactoring the existing 30+ section components to consume the new dark tokens systematically — leave as-is unless a snapshot regression forces it
- Re-validating Story 5.6 SSG prerender output beyond the Hero LCP smoke from Task 4

### Subtasks land in Jira

Per CLAUDE.md, every task lands as a child Sub-task issue.

## Dev Agent Record

### Implementation Plan

Task 1 — Prerender exclusion model: Added `PRERENDER_INCLUDED_ROUTES` (containing `'/'`), `PRERENDER_EXCLUDED_ROUTES` (with `/v2`, `/demo`, `/dashboard`, `/dashboard/*`, `/admin`, `/admin/*`, `/privacy`, `/404`), and `APP_REGISTERED_ROUTES` in `src/lib/route-registry.ts`. Defensive loop iterates registered routes and emits `console.warn` for any route absent from include/exclude coverage — none triggered on final run. Added `src/lib/route-registry.test.ts` to guard route/prerender coverage.

Task 2 — Dark mode smoke: Captured full-page browser screenshots for Home, Privacy, Admin Login, Admin Login error, Admin Dashboard, Admin Leads, and Admin Team under `_bmad-output/test-artifacts/dark-mode-regression-epic-7/screenshots/`. Finding: all existing pages remain legible under forced dark mode after the admin Login CTA contrast patch. Documented in `_bmad-output/test-artifacts/dark-mode-regression-epic-7/dark-mode-regression-report.md`.

Task 3 — Contrast manifest: `npm run check:contrast` re-ran; 36 legacy brand entries, 17 AA-normal passes, 24 waivers, plus 11 active Epic 7 dark token text/background pairs, all 11 AA-normal passes, 0 new violations. Patched `--destructive-foreground` to `oklch(0.985 0 0)` so the destructive toast pair passes AA.

Task 4 — Lighthouse re-baseline: Both `npm run lhci` (desktop) and `npm run lhci:mobile` passed all error assertions. Only the pre-existing desktop `unused-javascript` warning remained. No score drops ≥ 0.05. No re-baseline needed. Thresholds in `lighthouserc.json` / `lighthouserc.mobile.json` unchanged. Scores recorded in `_bmad-output/test-artifacts/lhci-story-7-7-summary.md`.

Task 5 — Axe sweep: `@axe-core/playwright` ran against `/` and `/privacy` × 3 locales plus `/admin/login`, `/admin/dashboard`, `/admin/leads`, `/admin/team` via `tests/e2e/a11y-axe.spec.ts`. Color contrast is active. All 10 chromium tests passed. Zero critical/serious violations. Results captured in `_bmad-output/test-artifacts/axe-epic-7-sweep.md`.

Task 6 — Snapshot rebase: `npm run test:run` — 101 files / 862 tests all passed. Zero snapshot failures. The dark mode default was in place before this story; no palette change occurred in 7.7 that would cause snapshot drift.

### Debug Log

- LHCI desktop: all error assertions pass; `unused-javascript` warn is pre-existing (lazy-loaded Epic 7 chunks).
- LHCI mobile: all assertions pass with no errors.
- Axe parallel race condition: `browserContext.close` error when running 6 workers simultaneously against shared preview server. Fixed by setting `--workers=1`. Pre-existing environment constraint, not an axe violation.
- No snapshot updates were needed or made.

### Completion Notes

All AC 1–7 satisfied. Cross-model review ran via senior reviewer agents using `bmad-code-review`; all six review findings were patched in-story. No non-trivial unresolved findings remain, so no new follow-up story is required.

Key outcome: `scripts/prerender.tsx` now has an explicit route allowlist/exclusion model with a defensive warn and route-registry guardrail. Story 5.6 hero prerender (LCP) confirmed intact. Dark mode regression sweep has screenshot evidence. Lighthouse baselines hold. Axe sweep clean across all required routes.

## File List

- `scripts/prerender.tsx` — Added route-registry-backed include/exclude coverage and defensive warn loop (AC 1)
- `src/lib/route-registry.ts` — Shared route registry + wildcard-aware prerender decision helper (review patch, AC 1)
- `src/lib/route-registry.test.ts` — Guardrail tests for route/prerender decision coverage (review patch, AC 1)
- `tests/e2e/a11y-axe.spec.ts` — Expanded axe coverage to admin Login + authenticated admin routes; color contrast active (review patch, AC 5)
- `tests/e2e/story-7-7-regression.spec.ts` — Browser screenshot evidence capture for required dark-mode routes (review patch, AC 2)
- `src/pages/admin/Login.tsx` — Patched sign-in CTA contrast from `bg-brand-electric-blue` to `bg-brand-deep` after axe finding (review patch, AC 5)
- `src/index.css` — Patched active dark `--destructive-foreground` token to pass Epic 7 dark-token contrast (review patch, AC 3)
- `scripts/check-brand-contrast.mjs` — Added active Epic 7 dark token text/background pair audit (review patch, AC 3)
- `src/lib/brand-tokens.contrast.test.ts` — Added Epic 7 dark-token contrast assertions (review patch, AC 3)
- `src/lib/brand-tokens.contrast.manifest.ts` — Regenerated manifest with Epic 7 dark-token contrast entries (review patch, AC 3)
- `_bmad-output/test-artifacts/dark-mode-regression-epic-7/dark-mode-regression-report.md` — Dark mode smoke findings per route (AC 2)
- `_bmad-output/test-artifacts/dark-mode-regression-epic-7/screenshots/*.png` — Full-page screenshot evidence for required routes (review patch, AC 2)
- `_bmad-output/test-artifacts/axe-epic-7-sweep.md` — Axe accessibility sweep results (AC 5)
- `_bmad-output/test-artifacts/lhci-story-7-7-summary.md` — Desktop/mobile Lighthouse score and threshold summary (review patch, AC 4)

## Change Log

- 2026-05-23: Story 7.7 implementation — prerender exclusion model + Epic 7 dark mode regression sweep. All gates green (typecheck, 862 tests, build, LHCI desktop+mobile, axe). No regressions found.
- 2026-05-23: Code review patches — route registry guardrail, full admin axe coverage, screenshot evidence, Epic 7 dark-token contrast audit, Lighthouse summary artifact, and cross-model sign-off. No new follow-up stories required because all review findings were patched in-story.
